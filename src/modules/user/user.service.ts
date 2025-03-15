import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, BadGatewayException} from '@nestjs/common';
import crypto from 'crypto';
import { RegisterUserDTO } from './dto/register.dto';
import { LoginUserDTO } from './dto/login.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getInfoData } from 'src/shared/utils';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { JwtService } from '../auth/jwt.service';
import { KeyTokenService } from '../keytoken/keytoken.service';
import { KeyToken } from '@prisma/client';
import { RefreshTokenUsed } from '@prisma/client';
import { EmailService } from 'src/services/email/email.service';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { randomBytes } from 'node:crypto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
@Injectable()
export class UserService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly keytokenService: KeyTokenService,
        private readonly emailService: EmailService,
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
        const foundUser = await this.find(email)
        if(!foundUser) throw new UnauthorizedException('user not registed');

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
        if(!foundUser) throw new BadRequestException('user not registed');

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

            const notificationThread = await this.prismaService.notificationThread.create({
                data:{
                    userId: newUser.id
                }
            })

            return{
                user:getInfoData(['id','email',],newUser),
                notificationThread,
                tokens
            }
        }
        return {
            code:200,
            metadata:null
        }  
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDTO): Promise<{ message: string }> {
        const { email } = forgotPasswordDto;
        
        // Find the user by email
        const user = await this.find(email);
        if (!user) {
          // For security reasons, we still return success even if the email doesn't exist
          return { message: 'If your email is registered with us, you will receive a password reset link' };
        }
        const resetToken = randomBytes(32).toString('hex');
        
        // Set token expiration (1 hour from now)
        const expiresAt = new Date();
        console.log('expiresAt',expiresAt)
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        await this.prismaService.passwordReset.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt,
                createdAt: BigInt(Date.now()),
                updatedAt: BigInt(Date.now())
            }
        });
    
        const emailSent = await this.emailService.sendPasswordResetEmail(email, resetToken);        
        if (!emailSent) {
          throw new BadRequestException('Failed to send reset email');
        }
    
        return { message: 'If your email is registered with us, you will receive a password reset link' };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDTO): Promise<{ message: string }> {
        const { token, password } = resetPasswordDto;
        
        /*
            "id": "uuid-123",
            "userId": "uuid-456",
            "token": "some-random-token",
            "expiresAt": "2025-01-01T00:00:00.000Z",
            "isUsed": false,
            "isActive": true,
            "createdAt": 1700000000,
            "updatedAt": 1700000000,
            "user": {
                "id": "uuid-456",
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "123456789",
                "status": "ACTIVE",
                "isActive": true,
                "avatar": "profile.jpg"
            }
        */
        const passwordReset = await this.prismaService.passwordReset.findFirst({
            where: {
                token,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                user: true
            }
        });
    
        if (!passwordReset) {
          throw new BadRequestException('Invalid or expired token');
        }
    
        // Update the token as used
        await this.prismaService.passwordReset.update({
            where: { id: passwordReset.id },
            data: {
                isUsed: true,
                updatedAt: BigInt(Date.now())
            }
        });
    
        // Hash the new password and update the user
        const salt = randomBytes(32).toString('hex');
        const passwordHashed = await this.hashPassword(password, salt);
    
        await this.prismaService.user.update({
            where: { id: passwordReset.userId },
            data: {
                password: passwordHashed,
                salt,
                updatedAt: BigInt(Date.now())
            }
        });
    
        return { message: 'Password reset successful' };
    }
    
    async validatePasswordResetToken(token: string): Promise<{ valid: boolean }> {

        const passwordReset = await this.prismaService.passwordReset.findFirst({
            where: {
                token,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        });
        
        return { valid: !!passwordReset };
    }
}
