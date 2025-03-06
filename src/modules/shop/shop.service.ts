import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException} from '@nestjs/common';
import crypto from 'crypto';
import { RegisterShopDTO } from './dto/register.dto';
import { LoginShopDTO } from './dto/login.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { RoleShop } from 'src/shared/enums/shop.enum';
import { getInfoData } from 'src/shared/utils';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { JwtService } from '../auth/jwt.service';
import { KeyTokenService } from '../keytoken/keytoken.service';
import { KeyToken } from '@prisma/client';
import { RefreshTokenUsed } from '@prisma/client';
@Injectable()
export class ShopService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly keytokenService: KeyTokenService
    ) {}

    private hashPassword(password:string, salt:string):Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, 100,64,'sha512', (err, key) => {
                if (err) return  reject(err)
                resolve(key.toString('hex'));
            })
        });
    }

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
    }

    private async find(find: string){
        return this.prismaService.shop.findFirst({
            where: {email:find},
        });
    }

    private async upsertKeyStore(accountId: string, publicKey: string, refreshToken: string){
        return await this.keytokenService.createKeyToken({
            accountId,
            publicKey,
            refreshToken,
            roles: 'SHOP'
        })
    }

    async handleRefreshToken( keyStore: IKeyToken, account: JWTdecode, refreshToken: string ): Promise<{
        tokens:{
            accessToken: string,
            refreshToken: string
        };
        update: KeyToken;
        createUsedToken: RefreshTokenUsed; 
    }>{
        //1 check wheather user's token been used or not, if been used, remove key and for them to relogin
        const {accountId, email} = account;

        const duplicateJWT = await this.prismaService.refreshTokenUsed.findFirst({
            where:{
                token: refreshToken
            }
        })

        if(duplicateJWT) throw new ForbiddenException('Something wrong happended, please relogin')

        //2 if user's token is not valid token, force them to relogin, too
        if(keyStore.refreshToken !== refreshToken)throw new UnauthorizedException('something was wrong happended, please relogin')
        const foundShop = await this.find(email)
        if(!foundShop) throw new UnauthorizedException('shop not registed');

        //3 if this accesstoken is valid, create new accesstoken, refreshtoken
        const { publicKey, privateKey } = this.generateKeyPair()
        const tokens = this.jwtService.createToken({accountId: accountId,email, role: 'SHOP'},publicKey,privateKey)

        const update = await this.prismaService.keyToken.update({
            where:{
                accountId: account.accountId
            },
            data:{
                publicKey,
                refreshToken: tokens.refreshToken
            }
        })

        const createUsedToken = await this.prismaService.refreshTokenUsed.create({
            data:{
                token:refreshToken,
                keyTokenId: update.id
            }
        })

        return {
            tokens,
            update,
            createUsedToken
        }
    };

    async logout ( keyStore: IKeyToken ): Promise<KeyToken | null>{
        return await this.keytokenService.removeKeyByAccountID(keyStore.accountId );
    };

    async login(login: LoginShopDTO): Promise<{
        shop: object;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>{
        //check whether shop existed or not
        const foundShop = await this.find(login.email);
        if(!foundShop) throw new BadRequestException('Shop not registed');

        //hash password and compare
        const passwordHashed =await this.hashPassword(login.password, foundShop.salt);
        if (passwordHashed !== foundShop.password) throw new UnauthorizedException('Wrong password!!!');

        //create key pair
        const { publicKey, privateKey } = this.generateKeyPair();
        const tokens = this.jwtService.createToken({accountId: foundShop.id,email: login.email, role: 'SHOP'}, publicKey, privateKey);

        //create new keytoken
        const keyStore = await this.upsertKeyStore(foundShop.id, publicKey, tokens.refreshToken)
        if(!keyStore) throw new Error('cannot generate keytoken');

        return{
            shop:getInfoData(['id','email'],foundShop),
            tokens
        }
    }

    async register(register: RegisterShopDTO) {
        //check whether shop existed
        const shopHolder = await this.find(register.email);
        if(shopHolder) throw new BadRequestException('Shop already existed');

        //hash password
        const salt = crypto.randomBytes(32).toString('hex')
        const passwordHashed = await this.hashPassword(register.password, salt)

        //create new shop
        const newShop = await this.prismaService.shop.create({
            data:{
                name: register.name,
                salt,
                email: register.email,
                password:passwordHashed,
                roles:RoleShop.SHOP
            }
        })

        if(newShop){
            const { publicKey, privateKey } = this.generateKeyPair();
            
            //create token pair
            const tokens = this.jwtService.createToken({accountId:newShop.id, email: newShop.email, role: 'SHOP'},publicKey, privateKey)
            if(!tokens) throw new BadRequestException('create tokens error!!!!!!')

            //create key store
            const keyStore = await this.upsertKeyStore(newShop.id, publicKey, tokens.refreshToken)
            if(!keyStore) throw new Error('cannot generate keytoken');

            return{
                shop:getInfoData(['id','email',],newShop),
                tokens
            }
        }
        return {
            code:200,
            metadata:null
        }  
    }
}
