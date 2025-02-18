import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException} from '@nestjs/common';
import * as crypto from 'crypto';
import { RegisterShopDTO } from './dto/register.dto';
import { LoginShopDTO } from './dto/login.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { RoleShop } from 'src/shared/enums/shop.enum';
import { getInfoData } from 'src/shared/utils';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { IJWTdecode } from 'src/shared/interfaces/jwt.interface';
import { JwtService } from '../auth/jwt.service';
import { KeyTokenService } from '../keytoken/keytoken.service';

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

    private generateKeyPair(){
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

    private find(find: string){
        return this.prismaService.shop.findFirst({
            where: {email:find},
        });
    }

    async handleRefreshToken( keyStore: IKeyToken, account: IJWTdecode, refreshToken: string ){
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
        const foundUser = await this.find(email)
        if(!foundUser) throw new UnauthorizedException('shop not registed');

        //3 if this accesstoken is valid, create new accesstoken, refreshtoken
        const { publicKey, privateKey } = this.generateKeyPair()
        const tokens = this.jwtService.createToken({accountId: accountId,email, role: 'user'},publicKey,privateKey)

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

    async logout ( keyStore: IKeyToken ){
        const delKey = await this.keytokenService.removeKeyByAccountID(keyStore.accountId );
        return delKey 
    };

    async login(login: LoginShopDTO) {
        const foundShop = await this.find(login.email);
        if(!foundShop) throw new BadRequestException('Shop not registed');

        const passwordHashed =await this.hashPassword(login.password, foundShop.salt);
        if (passwordHashed !== foundShop.password) throw new UnauthorizedException('Wrong password!!!');

        const { publicKey, privateKey } = this.generateKeyPair();
        const tokens = this.jwtService.createToken({accountId: foundShop.id,email: login.email, role: 'shop'}, publicKey, privateKey);

        await this.keytokenService.createKeyToken({
            accountId: foundShop.id,
            publicKey,
            refreshToken:tokens.refreshToken,
            roles: "SHOP"
        })

        return{
            shop:getInfoData(['uuid','email'],foundShop),
            tokens
        }
    }

    async register(register: RegisterShopDTO) {
        const shopHolder = await this.find(register.email);
        if(shopHolder) throw new BadRequestException('User already existed');

        const salt = crypto.randomBytes(32).toString('hex')
        const passwordHashed = await this.hashPassword(register.password, salt)

        const newUser = await this.prismaService.shop.create({
            data:{
                name: register.name,
                salt,
                email: register.email,
                password:passwordHashed,
                roles:RoleShop.SHOP
            }
        })

        if(newUser){
            const { publicKey, privateKey } = this.generateKeyPair();
            const tokens = this.jwtService.createToken({accountId:newUser.id, email: newUser.email, role: 'shop'},publicKey, privateKey)
            if(!tokens) throw new BadRequestException('create tokens error!!!!!!')
            const keyStore = await this.keytokenService.createKeyToken({
                accountId: newUser.id,
                publicKey:publicKey,
                refreshToken:tokens.refreshToken,
                roles: 'SHOP'
            })
            if(!keyStore) throw new Error('cannot generate keytoken');

            return{
                shop:getInfoData(['id','email',],newUser),
                tokens
            }
        }
        return {
            code:200,
            metadata:null
        }  
    }
}
