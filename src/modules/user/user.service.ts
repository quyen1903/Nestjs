import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, BadGatewayException} from '@nestjs/common';
import crypto from 'crypto';
import { RegisterUserDTO } from './dto/register.dto';
import { LoginUserDTO } from './dto/login.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getInfoData } from 'src/shared/utils';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { IJWTdecode } from 'src/shared/interfaces/jwt.interface';
import { JwtService } from '../auth/jwt.service';
import { KeyTokenService } from '../keytoken/keytoken.service';
import { KeyToken } from '@prisma/client';
import { RefreshTokenUsed } from '@prisma/client';

@Injectable()
export class UserService {
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

    private find(find: string){
        return this.prismaService.user.findFirst({
            where: {email:find},
        });
    }

    private async upsertKeyStore(accountId: string, publicKey: string, refreshToken: string){
        return await this.keytokenService.createKeyToken({
            accountId,
            publicKey,
            refreshToken,
            roles: 'USER'
        })
    }

    async handleRefreshToken( keyStore: IKeyToken, account: IJWTdecode, refreshToken: string ): Promise<{
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
        const foundUser = await this.find(email)
        if(!foundUser) throw new UnauthorizedException('shop not registed');

        //3 if this accesstoken is valid, create new accesstoken, refreshtoken
        const { publicKey, privateKey } = this.generateKeyPair()
        const tokens = this.jwtService.createToken({accountId: accountId,email, role: 'USER'},publicKey,privateKey)

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

    async login(login: LoginUserDTO): Promise<{
        user: object;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>{
        const foundUser = await this.find(login.email);
        if(!foundUser) throw new BadRequestException('Shop not registed');

        const passwordHashed =await this.hashPassword(login.password, foundUser.salt);
        if (passwordHashed !== foundUser.password) throw new UnauthorizedException('Wrong password!!!');

        const { publicKey, privateKey } = this.generateKeyPair();
        const tokens = this.jwtService.createToken({accountId: foundUser.id,email: login.email, role: 'USER'}, publicKey, privateKey);

        const keyStore = await this.upsertKeyStore(foundUser.id, publicKey, tokens.refreshToken)
        if(!keyStore) throw new Error('cannot generate keytoken');

        return{
            user:getInfoData(['id','email'],foundUser),
            tokens
        }
    }

    async register(register: RegisterUserDTO) {
        const userHolder = await this.find(register.email);
        if(userHolder) throw new BadGatewayException('User already existed');

        const salt = crypto.randomBytes(32).toString('hex')
        const passwordHashed = await this.hashPassword(register.password, salt)

        const newUser = await this.prismaService.user.create({
            data:{
                name: register.name,
                salt,
                email: register.email,
                password:passwordHashed,
                phone: register.phone,
                sex: register.sex,
                avatar: register.avatar,
                dateOfBirth: new Date(register.dateOfBirth)
            }
        })

        if(newUser){
            const { publicKey, privateKey } = this.generateKeyPair();
            const tokens = this.jwtService.createToken({accountId:newUser.id, email: newUser.email, role: 'USER'},publicKey, privateKey)
            if(!tokens)throw new BadGatewayException('create tokens error!!!!!!')

            const keyStore = await this.upsertKeyStore(newUser.id, publicKey, tokens.refreshToken)
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
    }}
