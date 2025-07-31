import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import { RegisterShopDTO } from './dto/register.dto';
import { LoginShopDTO } from './dto/login.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getInfoData } from 'src/shared/utils';
import { ProducerService } from 'src/services/kafka/services/producer.service';
import { ShopKeyToken, ShopRefreshTokenUsed } from '@prisma/client';
import { ShopKeyTokenService } from '../auth/shop-auth/shop-auth.keytoken';
import { RoleShop } from '@prisma/client';
import { JwtShop } from '../auth/shop-auth/interface/jwt.shop';
@Injectable()
export class ShopService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly shopKeyTokenService: ShopKeyTokenService,
        private readonly producerService: ProducerService,
        
    ) {};

    /**
     * 
     * @param userId 
     * @param userName 
     * @param privateKey 
     * @returns accesstoken to authorize, refreshtoken to get new accesstoken 
     */
    private createTokenPair(shopId: string, permissions: string[], privateKey: string){
        const payload = {                
            sub: shopId,
            role: RoleShop.SHOP,
            permissions,
        };
        
        const accessToken = this.jwtService.sign(payload,  
            {
                privateKey,              
                algorithm: 'RS256',      
                expiresIn: '1h',         
            }
        )

        const refreshToken = this.jwtService.sign(payload,  
            {
                privateKey,              
                algorithm: 'RS256',      
                expiresIn: '6h',         
            }
        )
        return {accessToken, refreshToken}
    };

    /**
     * 
     * @param password original password
     * @param salt random string
     * @returns hashed password, which had been add salt to hash, almost impossible to brute force
     */
    private hashPassword(password:string, salt:string):Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, 100,64,'sha512', (err, key) => {
                if (err) return  reject(err)
                resolve(key.toString('hex'));
            })
        });
    };

    /**
     * 
     * @returns return public key and private key
     * in cryptography
     * public key are use for decrypt and to authorize jwt (this is our use case)
     * private key are use for encrypt and to create jwt (this is our use case)
     * public key are store in database, we drop private key
     * 
     * in both user case, anybody can see public key, it's ok. But dont let any one know your private key
     */
    private generateKeyPair(): {
        publicKey: string;
        privateKey: string;
    }{
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa',{
            modulusLength:4096,
            publicKeyEncoding:{
                type:'pkcs1',
                format:'pem'
            },
            privateKeyEncoding:{
                type:'pkcs1',
                format:'pem'
            }
        })
        return {publicKey, privateKey}
    };

    /**
     * use case: find shop in database
     * purpose: check shop existed or not, or retrieve information about shop
     * @param find 
     * @returns 
     */
    private async find(find: string){
        return this.prismaService.shop.findFirst({
            where: {email:find},
        });
    };

    /**
     * deprecated,now need to fix this method
     * purpose: to upsert (create or update)
     * @param accountId 
     * @param publicKey 
     * @param refreshToken 
     * @returns 
     */
    private async upsertKeyStore(accountId: string, publicKey: string, refreshToken: string){
        return await this.shopKeyTokenService.createKeyToken({
            accountId,
            publicKey,
            refreshToken,
            roles: 'SHOP'
        })
    };

    async getShopInfo(id: string){
        console.log('shopId',id)
        return await this.prismaService.shop.findUnique({
            where:{
                id
            },
            select:{
                id: true,
                name: true,
                isActive: true,
                createdAt:  true,
                updatedAt: true
            }
        })
    };

    // /**
    //  * use refreshtoken to get new token pair
    //  * @param keyStore 
    //  * @param account 
    //  * @param refreshToken 
    //  * @returns new token pair
    //  */
    // async handleRefreshToken( keyStore: ShopKeyToken, account: JwtShop, userRefreshToken: string ): Promise<{
    //     accessToken: string,
    //     refreshToken: string
    //     update: ShopKeyToken;
    //     createUsedToken: ShopRefreshTokenUsed; 
    // }>{
    //     //1 check wheather user's token been used or not, if been used, remove key and for them to relogin
    //     const {sub, username} = account;

    //     const duplicateJWT = await this.prismaService.shopRefreshTokenUsed.findFirst({
    //         where:{
    //             token: userRefreshToken
    //         }
    //     })

    //     if(duplicateJWT) throw new ForbiddenException('Something wrong happended, please relogin')

    //     //2 if user's token is not valid token, force them to relogin, too
    //     if(keyStore.refreshToken !== userRefreshToken)throw new UnauthorizedException('something was wrong happended, please relogin')
    //     const foundShop = await this.find(username)
    //     if(!foundShop) throw new UnauthorizedException('shop not registed');

    //     //3 if this accesstoken is valid, create new accesstoken, refreshtoken
    //     const { publicKey, privateKey } = this.generateKeyPair()
    //     const {accessToken, refreshToken} = this.createTokenPair(foundShop.id, ["product:create", "order:view"], privateKey);

    //     const update = await this.prismaService.shopKeyToken.update({
    //         where:{
    //             sub: sub
    //         },
    //         data:{
    //             publicKey,
    //             refreshToken: refreshToken
    //         }
    //     })

    //     const createUsedToken = await this.prismaService.shopRefreshTokenUsed.create({
    //         data:{
    //             token:refreshToken,
    //             keyTokenId: update.id
    //         }
    //     })

    //     return {
    //         accessToken,
    //         refreshToken,
    //         update,
    //         createUsedToken
    //     }
    // };

    // async logout ( keyStore: JwtShop ): Promise<ShopKeyToken | null>{
    //     console.log("keystore",keyStore)
    //     return await this.shopKeyTokenService.removeKeyByAccountID(keyStore.sub);
    // };

    // async login(login: LoginShopDTO): Promise<{
    //     shop: object;
    //     accessToken: string;
    //     refreshToken: string;
    // }>{
    //     //check whether shop existed or not
    //     const foundShop = await this.find(login.email);
    //     if(!foundShop) throw new BadRequestException('Shop not registed');

    //     //hash password and compare
    //     const passwordHashed =await this.hashPassword(login.password, foundShop.salt);
    //     if (passwordHashed !== foundShop.password) throw new UnauthorizedException('Wrong password!!!');

    //     //create key pair
    //     const { publicKey, privateKey } = this.generateKeyPair();
    //     const {accessToken, refreshToken} = this.createTokenPair(foundShop.id, ["product:create", "order:view"], privateKey);

    //     //create new keytoken
    //     const keyStore = await this.upsertKeyStore(foundShop.id, publicKey, refreshToken)
    //     if(!keyStore) throw new Error('cannot generate keytoken');

    //     await this.producerService.produce({
    //         topic: 'login',
    //         messages: [{
    //             value: `${foundShop.name} has login to our system`
    //         }]
    //     })

    //     return{
    //         shop:getInfoData(['id','email'],foundShop),
    //         accessToken, 
    //         refreshToken
    //     }
    // }

    // async register(register: RegisterShopDTO) {
    //     //check whether shop existed
    //     const shopHolder = await this.find(register.email);
    //     if(shopHolder) throw new BadRequestException('Shop already existed');

    //     //hash password
    //     const salt = crypto.randomBytes(32).toString('hex');
    //     const passwordHashed = await this.hashPassword(register.password, salt);

    //     //create new shop
    //     const newShop = await this.prismaService.shop.create({
    //         data:{
    //             name: register.name,
    //             salt,
    //             email: register.email,
    //             password:passwordHashed,
    //             roles:RoleShop.SHOP
    //         }
    //     });

    //     if(newShop){
    //         const { publicKey, privateKey } = this.generateKeyPair();
            
    //         //create token pair
    //         const {accessToken, refreshToken} = this.createTokenPair(newShop.id, ["product:create", "order:view"], privateKey);
    //         if(!accessToken || !refreshToken) throw new BadRequestException('create tokens error!!!!!!');

    //         //create key store
    //         const keyStore = await this.upsertKeyStore(newShop.id, publicKey, refreshToken);
    //         if(!keyStore) throw new Error('cannot generate keytoken');

    //         await this.producerService.produce({
    //             topic: 'login',
    //             messages: [{
    //                 value: `${newShop.name} has been created to our system`
    //             }]
    //         });

    //         return{
    //             shop:getInfoData(['id','email',],newShop),
    //             accessToken,
    //             refreshToken
    //         }
    //     };

    //     return {
    //         code:200,
    //         metadata:null
    //     }  
    // }

    async createAPIKey(){
        return await this.prismaService.aPIkey.create({
            data:{
                key:crypto.randomBytes(64).toString('hex'),
                status:true,
                permission:['0000'],
                isActive: true
            }
        })
    }
}
