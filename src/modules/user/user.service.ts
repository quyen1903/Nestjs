import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, BadGatewayException} from '@nestjs/common';
import crypto from 'crypto';
import { RegisterUserDTO } from './dto/register.dto';
import { LoginUserDTO } from './dto/login.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getInfoData } from 'src/shared/utils';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { KeyTokenService } from '../keytoken/keytoken.service';
import { KeyToken, User, UserAuth, UserProfile, UserSocial } from '@prisma/client';
import { RefreshTokenUsed } from '@prisma/client';
import { EmailService } from 'src/services/email/email.service';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { randomBytes } from 'node:crypto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly keytokenService: KeyTokenService,
        private readonly emailService: EmailService,
        private readonly authService: AuthService
    ) {};

    private createTokenPair(userId: string, userName: string){
        const { privateKey } = this.authService.generateKeyPair();

        const payload = {                
            accountId:userId, 
            username: userName,
            role: 'USER'
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
    }

    private async upsertKeyStore(accountId: string, publicKey: string, refreshToken: string){
        return await this.keytokenService.createKeyToken({
            accountId,
            publicKey,
            refreshToken,
            roles: 'USER'
        })
    };

    private async find(userName: string){
        const user =await this.prismaService.userAuth.findUnique({where:{userName}})
        return user 
    };

    async handleRefreshToken( keyStore: IKeyToken, account: JWTdecode, storedRefreshToken: string ): Promise<{
        accessToken: string,
        refreshToken: string
        update: KeyToken;
        createUsedToken: RefreshTokenUsed; 
    }>{
        //1 check wheather user's token been used or not, if been used, remove key and for them to relogin
        const {accountId, username} = account;

        const duplicateJWT = await this.prismaService.refreshTokenUsed.findFirst({
            where:{
                token: storedRefreshToken
            }
        })

        if(duplicateJWT) throw new ForbiddenException('Something wrong happended, please relogin')

        //2 if user's token is not valid token, force them to relogin, too
        if(keyStore.refreshToken !== storedRefreshToken)throw new UnauthorizedException('something was wrong happended, please relogin')
        const foundUser = await this.find(username)
        if(!foundUser) throw new UnauthorizedException('user not registed');

        //3 if this accesstoken is valid, create new accesstoken, refreshtoken
        const { publicKey, privateKey } = this.authService.generateKeyPair()
        const {accessToken, refreshToken} = this.createTokenPair(foundUser.userId, foundUser.userName)


        const update = await this.prismaService.keyToken.update({
            where:{
                accountId: account.accountId
            },
            data:{
                publicKey,
                refreshToken: refreshToken
            }
        })

        const createUsedToken = await this.prismaService.refreshTokenUsed.create({
            data:{
                token:refreshToken,
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

    async logout ( keyStore: IKeyToken ): Promise<KeyToken | null>{
        return await this.keytokenService.removeKeyByAccountID(keyStore.accountId );
    };

    async loginManual(login: LoginUserDTO): Promise<{
        user: object;
        accessToken: string;
        refreshToken: string;
    }>{
        const foundUser = await this.find(login.email);
        if(!foundUser) throw new BadRequestException('user not registed');

        const passwordHashed =await this.authService.hashPassword(login.password, foundUser.salt);
        if (passwordHashed !== foundUser.password) throw new UnauthorizedException('Wrong password!!!');

        const { publicKey, privateKey } = this.authService.generateKeyPair();
        const {accessToken, refreshToken} = this.createTokenPair(foundUser.userId, foundUser.userName)

        const keyStore = await this.upsertKeyStore(foundUser.userId, publicKey, refreshToken)
        if(!keyStore) throw new Error('cannot generate keytoken');

        return{
            user:getInfoData(['id','email'],foundUser),
            accessToken, 
            refreshToken
        }
    }

    async registerManual(register: RegisterUserDTO) {
        const userHolder = await this.find(register.name);
        if(userHolder) throw new BadGatewayException('User already existed');

        const salt = crypto.randomBytes(32).toString('hex');
        const passwordHashed = await this.authService.hashPassword(register.password, salt);

        /**
         * we will use transaction to create user
         * this make sure in our database, user Password-based signup
         * will have profile, authentication information without missing 
         * any data
         */

        let newUser:User, newUserAuth: UserAuth, newUserProfile: UserProfile;

        await this.prismaService.$transaction(async(tx)=>{
            const user =await tx.user.create({});

            const userAuth = await tx.userAuth.create({
                data:{
                    userId: user.id,
                    password: passwordHashed,
                    salt,
                    userName: register.userName
                }
            });

            const userProfile = await tx.userProfile.create({
                data:{
                    userId: user.id,
                    name: register.name,
                    phone: register.phone,
                    sex: register.sex,
                    avatar: register.avatar,
                    dateOfBirth: register.dateOfBirth
                }
            });

            newUser = user,newUserAuth = userAuth ,newUserProfile = userProfile;
        })

        if(newUser && newUserProfile && newUserAuth){
            const { publicKey } = this.authService.generateKeyPair();
            const {accessToken, refreshToken} = this.createTokenPair(newUserAuth.userId, newUserAuth.userName)
            if(!accessToken && !refreshToken)throw new BadGatewayException('create tokens error!!!!!!')

            const keyStore = await this.upsertKeyStore(newUser.id, publicKey, refreshToken)
            if(!keyStore) throw new Error('cannot generate keytoken');

            const notificationThread = await this.prismaService.notificationThread.create({
                data:{
                    userId: newUser.id
                }
            })

            return{
                user:getInfoData(['id','email',],newUser),
                notificationThread,
                accessToken,
                refreshToken
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
                userId: user.userId,
                token: resetToken,
                expiresAt,
                createdAt: BigInt(Date.now()),
                updatedAt: BigInt(Date.now())
            }
        });
    
        const emailSent = await this.emailService.sendPasswordResetEmail(email, resetToken);        
        if (!emailSent) throw new BadRequestException('Failed to send reset email');
        
    
        return { message: 'If your email is registered with us, you will receive a password reset link' };
    }

    async resetPasswordManual(resetPasswordDto: ResetPasswordDTO): Promise<{ message: string }> {
        const { token, password } = resetPasswordDto;
        
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
        const passwordHashed = await this.authService.hashPassword(password, salt);
    
        await this.prismaService.userAuth.update({
            where: { userId: passwordReset.userId },
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
