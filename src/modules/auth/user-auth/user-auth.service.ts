import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, BadGatewayException} from '@nestjs/common';
import crypto from 'crypto';
import { RegisterUserDTO } from './dto/register.dto';
import { LoginUserManualDTO } from './dto/login.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getInfoData } from 'src/shared/utils';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { UserKeyTokenService } from './user-auth.keytoken';
import { UserKeyToken,UserRefreshTokenUsed, User, UserAuth, UserProfile, UserSocial, UserSocialProvider, Sex } from '@prisma/client';
import { EmailService } from 'src/services/email/email.service';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { randomBytes } from 'node:crypto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { ProducerService } from 'src/services/kafka/services/producer.service';

// =====================================
// SOCIAL LOGIN FLOW - NOTES
// =====================================

// Step 1: Find if social account (provider + providerId) already linked
//   - If found → login user
//   - If not found → continue

// Step 2: Check if a user exists with the same email (manual registered)
//   - If exists → DO NOT auto-link
//   - Throw an error or prompt user to login manually first
//   - Reason: Cannot trust email alone to identify same person

// Step 3: If no user found with email
//   - Create new User + UserProfile + UserSocial (linked to this providerId)
//   - Proceed with login as new user

// =====================================
// SOCIAL LINKING FLOW (AFTER LOGIN MANUAL)
// =====================================

// Endpoint: POST /auth/link-social
// Requirements:
//   - User must be logged in manually (email + password)
//   - Body must include: provider, providerId, email

// Steps:
//   - Step 1: Check if providerId already linked → if yes, throw error
//   - Step 2: Check if request email matches logged-in user's email
//   - Step 3: Create UserSocial entry to link the provider to the current user

// Optional: Send confirmation message like "Google account successfully linked"

// =====================================
// BEST PRACTICES
// =====================================
// - Do NOT trust email alone for linking accounts
// - Do NOT allow auto-linking between OAuth and manual accounts without user consent
// - Always check for providerId uniqueness
// - Allow one user to have multiple UserSocial entries (Google, Facebook, etc.)
// - Use proper unique constraints: @@unique([provider, providerId]), email unique in UserProfile

@Injectable()
export class UserAuthService extends AuthService{

    constructor(
        jwtService: JwtService,
        prismaService: PrismaService,
        private readonly userKeyTokenService: UserKeyTokenService,
        private readonly emailService: EmailService,
        private readonly authService: AuthService,
        producerService: ProducerService
    ) {
        super(prismaService,jwtService, producerService);

    };

    protected override createTokenPair(userId: string, userName: string, privateKey: string){
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
        return await this.userKeyTokenService.createKeyToken({
            accountId,
            publicKey,
            refreshToken,
            roles: 'USER'
        })
    };

    private async find(username: string){
        const user =await this.prismaService.userAuth.findUnique({where:{username}})
        return user 
    };

    async handleRefreshToken( keyStore: UserKeyToken, account: JwtUser, storedRefreshToken: string ): Promise<{
        accessToken: string,
        refreshToken: string
        update: UserKeyToken;
        createUsedToken: UserRefreshTokenUsed; 
    }>{
        //1 check wheather user's token been used or not, if been used, remove key and for them to relogin
        const {sub, username} = account;

        const duplicateJWT = await this.prismaService.userRefreshTokenUsed.findFirst({
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
        const { publicKey, privateKey } = this.generateKeyPair()
        const {accessToken, refreshToken} = this.createTokenPair(foundUser.userId, foundUser.username, privateKey)


        const update = await this.prismaService.userKeyToken.update({
            where:{
                sub: account.sub
            },
            data:{
                publicKey,
                refreshToken: refreshToken
            }
        })

        const createUsedToken = await this.prismaService.userRefreshTokenUsed.create({
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

    async logout ( keyStore: IKeyToken ): Promise<UserKeyToken | null>{
        return await this.userKeyTokenService.removeKeyByAccountID(keyStore.accountId );
    };

    async loginManual(login: LoginUserManualDTO): Promise<{
        user: object;
        accessToken: string;
        refreshToken: string;
    }>{
        const foundUser = await this.find(login.username);
        if(!foundUser) throw new BadRequestException('user not registed');

        const passwordHashed =await this.hashPassword(login.password, foundUser.salt);
        if (passwordHashed !== foundUser.password) throw new UnauthorizedException('Wrong password!!!');

        const { publicKey, privateKey } = this.generateKeyPair();
        const {accessToken, refreshToken} = this.createTokenPair(foundUser.userId, foundUser.username, privateKey);
        if(!accessToken || !refreshToken)throw new BadGatewayException('create tokens error!!!!!!');


        const keyStore = await this.upsertKeyStore(foundUser.userId, publicKey, refreshToken);
        if(!keyStore) throw new Error('cannot generate keytoken');

        return{
            user:getInfoData(['id','username'],foundUser),
            accessToken, 
            refreshToken
        };
    };

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
                    username: register.userName
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
            const { privateKey, publicKey } = this.generateKeyPair();
            const {accessToken, refreshToken} = this.createTokenPair(newUserAuth.userId, newUserAuth.username, privateKey)
            if(!accessToken || !refreshToken)throw new BadGatewayException('create tokens error!!!!!!')

            const keyStore = await this.upsertKeyStore(newUser.id, publicKey, refreshToken)
            if(!keyStore) throw new Error('cannot generate keytoken');

            const notificationThread = await this.prismaService.notificationThread.create({
                data:{
                    userId: newUser.id
                }
            })

            return{
                user:getInfoData(['id','username',],newUser),
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
        const user = await this.prismaService.userSocial.findFirst({
            where:{email}
        });
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
    
    //small notice here: typecasting  !! means if password reset is object, it return true,vice versa, return false
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

    async findOrCreateGoogleUser(social: UserSocial, profile: UserProfile | null) {
        const existingSocial = await this.prismaService.userSocial.findUnique({
            where: { email: social.email, providerId: social.providerId },
        });

        let user: User;

        if (!existingSocial) {
            // Create new user and related entities if social record does not exist
            const { newUser, newSocial, newProfile } = await this.prismaService.$transaction(async (tx) => {
                const newUser = await tx.user.create({ data: {} });

                const newSocial = await tx.userSocial.create({
                    data: {
                        provider: UserSocialProvider.GOOGLE,
                        providerId: social.providerId,
                        email: social.email,
                        userId: newUser.id,
                    },
                });

                let newProfile: UserProfile | null = null;
                if (profile && (profile.name || profile.phone)) {
                    newProfile = await tx.userProfile.create({
                        data: {
                            name: profile.name ?? '',
                            phone: profile.phone ?? '',
                            sex: profile.sex ?? Sex.FEMALE,
                            avatar: profile.avatar ?? '',
                            dateOfBirth: profile.dateOfBirth ?? new Date(0),
                            userId: newUser.id,
                        },
                    });
                }

                return { newUser, newSocial, newProfile };
            });

            user = newUser;

            // Create Notification Thread
            await this.prismaService.notificationThread.create({
                data: { userId: newUser.id },
            });
        } else {
            // Fetch existing user
            user = await this.prismaService.user.findUnique({
                where: { id: existingSocial.userId },
            });
        }

        // Generate Token Pair
        const { publicKey, privateKey } = this.generateKeyPair();
        const { accessToken, refreshToken } = this.createTokenPair(user.id, social.email, privateKey);

        if (!accessToken || !refreshToken) {
            throw new BadGatewayException('Failed to generate tokens');
        }

        // Upsert Key Store
        const keyStore = await this.upsertKeyStore(user.id, publicKey, refreshToken);
        if (!keyStore) {
            throw new BadGatewayException('Failed to create key store');
        }

        return {
            user,
            accessToken,
            refreshToken,
        };
    }
}
