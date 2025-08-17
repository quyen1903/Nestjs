import { Injectable, Logger, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ShopKeyTokenService } from './shop-auth.keytoken';
import { ProducerService } from 'src/services/kafka/services/producer.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterShopDTO, ShopBusinessDTO } from './dto/register.dto';
import { LoginShopDTO } from './dto/login.dto';
import { AuthService } from '../auth.service';
import { RoleShop,AccountType, AuthMethod, Account, AccountAuthentication, ShopBusiness } from '@prisma/client';
import { getInfoData } from 'src/shared/utils';
import { JwtShop } from './interface/jwt.shop';
import { ShopService } from 'src/modules/shop/shop.service';

@Injectable()
export class ShopAuthService extends AuthService {
    constructor(
        prismaService: PrismaService,
        jwtService: JwtService,
        private readonly shopKeyTokenService: ShopKeyTokenService,
        producerService: ProducerService,
        private readonly shopService: ShopService
    ){
        super(prismaService,jwtService, producerService);
    };

    /**
     * use case: find shop in database
     * purpose: check shop existed or not, or retrieve information about shop
     * @param find 
     * @returns 
     */

    protected override createTokenPair(id: string, email: string, privateKey: string) {
        const payload = {
            accountId: id,
            email,
            role: 'SHOP',
            permissions: ['order:read', 'order:write'] 
        };

        const accessToken = this.jwtService.sign(payload, {
            privateKey,
            algorithm: 'RS256',
            expiresIn: '1h',
        });

        const refreshToken = this.jwtService.sign(payload, {
            privateKey,
            algorithm: 'RS256',
            expiresIn: '6h',
        });

        return { accessToken, refreshToken };
    }

    private async find(find: string){
        return this.prismaService.shop.findFirst({
            where: {email:find},
        });
    };

    private async upsertKeyStore(accountId: Shop['id'], publicKey: ShopKeyToken['publicKey'], refreshToken: ShopKeyToken['refreshToken']){
        return await this.shopKeyTokenService.upsertShopKeyToken({
            accountId,
            publicKey,
            refreshToken,
            roles: RoleShop.SHOP
        })
    };

    async handleRefreshToken( shopId: Shop['id'], requestRefreshToken: ShopKeyToken['refreshToken'] ): Promise<{
        accessToken: string,
        refreshToken: string
        update: ShopKeyToken;
        createUsedToken: ShopRefreshTokenUsed; 
    }>{
        //1 check wheather user's token been used or not, if been used, remove key and for them to relogin
        // const {sub, email} = account;


        const duplicateJWT = await this.prismaService.shopRefreshTokenUsed.findFirst({
            where:{
                token: requestRefreshToken
            }
        });

        const foundShop = await this.shopService.getShopInfo(shopId)
        if(!foundShop) throw new UnauthorizedException('shop not registed');

        if(duplicateJWT) throw new ForbiddenException('Something wrong happended, please relogin');

        const keyStore = await this.shopKeyTokenService.findByRefreshToken(requestRefreshToken);


        //2 if user's token is not valid token, force them to relogin, too
        if(!keyStore)throw new UnauthorizedException('something was wrong happended, please relogin');

        //3 if this accesstoken is valid, create new accesstoken, refreshtoken
        const { publicKey, privateKey } = this.generateKeyPair()
        const {accessToken, refreshToken} = this.createTokenPair(foundShop.id, foundShop.email, privateKey);

        const update = await this.prismaService.shopKeyToken.update({
            where:{
                sub: foundShop.id
            },
            data:{
                publicKey,
                refreshToken: refreshToken
            }
        })

        const createUsedToken = await this.prismaService.shopRefreshTokenUsed.create({
            data:{
                token: requestRefreshToken,
                keyTokenId: update.id
            }
        })

        return {
            accessToken,
            refreshToken,
            update,
            createUsedToken
        }
    };
    
        async logout ( keyStore: JwtShop ): Promise<ShopKeyToken | null>{
            console.log("keystore",keyStore)
            return await this.shopKeyTokenService.removeKeyByAccountID(keyStore.sub);
        };
    

    async login(login: LoginShopDTO): Promise<{
        shop: object;
        accessToken: string;
        refreshToken: string;
    }>{
        //check whether shop existed or not
        const foundShop = await this.find(login.email);
        if(!foundShop) throw new BadRequestException('Shop not registed');

        //hash password and compare
        const passwordHashed =await this.hashPassword(login.password, foundShop.salt);
        if (passwordHashed !== foundShop.password) throw new UnauthorizedException('Wrong password!!!');

        //create key pair
        const { publicKey, privateKey } = this.generateKeyPair();
        const {accessToken, refreshToken} = this.createTokenPair(foundShop.id, foundShop.email, privateKey);

        //create new keytoken
        const keyStore = await this.upsertKeyStore(foundShop.id, publicKey, refreshToken)
        if(!keyStore) throw new Error('cannot generate keytoken');

        await this.producerService.produce({
            topic: 'login',
            messages: [{
                value: `${foundShop.name} has login to our system`
            }]
        })

        return{
            shop:getInfoData(['id','email'],foundShop),
            accessToken, 
            refreshToken
        }
    }

    async register(register: RegisterShopDTO, business: ShopBusinessDTO) {
        //check whether shop existed
        // const shopHolder = await this.find(register.email);
        // if(shopHolder) throw new BadRequestException('Shop already existed');



        // //create new shop
        // const newShop = await this.prismaService.shop.create({
        //     data:{
        //         name: register.name,
        //         salt,
        //         email: register.email,
        //         password:passwordHashed,
        //         roles:RoleShop.SHOP
        //     }
        // });

        // if(newShop){
            
        // };

        // return {
        //     code:200,
        //     metadata:null
        // }  

        //hash password
        const checkAccountExisted = await this.prismaService.accountAuthentication.findFirst({
            where:{
                OR:[                
                    {username: register.name},
                    {email: register.email}
                ]
            }
        });

        if(checkAccountExisted) throw new BadRequestException(" Username or Email already existed, please try again later")

        const salt = crypto.randomBytes(32).toString('hex');
        const passwordHashed = await this.hashPassword(register.password, salt);

        let transaction:{account: Account, accountAuth: AccountAuthentication, shopBusiness: ShopBusiness}
        try {
            await this.prismaService.$transaction(async()=>{
                const account = await this.prismaService.account.create({
                    data:{
                        accountType: AccountType.SHOP
                    }
                });

                const accountAuth = await this.prismaService.accountAuthentication.create({
                    data:{
                        accountId: account.id,
                        email: register.email,
                        passwordHash: passwordHashed,
                        passwordSalt: salt,
                        authMethod: AuthMethod.EMAIL_PASSWORD,                
                    }
                });

                const shopBusiness = await this.prismaService.shopBusiness.create({
                    data:{
                        ...business,
                        accountId: account.id
                    }
                });

                return transaction = {account, accountAuth, shopBusiness}
            });
        } catch (error) {
            Logger.error(`Error during creating account ${error}`);
        }

        //if successfully create account
        if(transaction){
            const { publicKey, privateKey } = this.generateKeyPair();
            
            //create token pair
            const {accessToken, refreshToken} = this.createTokenPair(transaction.account.id, transaction.accountAuth.email, privateKey);
            if(!accessToken || !refreshToken) throw new BadRequestException('create tokens error!!!!!!');

            
            //create key store
            const keyStore = await this.upsertKeyStore(transaction.account.id, publicKey, refreshToken);
            if(!keyStore) throw new Error('cannot generate keytoken');

            await this.producerService.produce({
                topic: 'login',
                messages: [{
                    value: `${transaction.shopBusiness.businessName} has been created to our system`,
                }]
            });

            return{
                transaction,
                accessToken,
                refreshToken
            }
        }
    }
    
}
