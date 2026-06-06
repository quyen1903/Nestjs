import { 
    Injectable,
    UnauthorizedException, 
    BadRequestException, 
    ForbiddenException, 
    BadGatewayException
} from '@nestjs/common';

import { 
    KeyToken,
    RefreshTokenUsed,
    Account,
    AccountType,
    AuthMethod,
    Sex
} from 'src/database/types';
import crypto from 'crypto';
import { LoginUserManualDTO } from './dto/login.dto';
import { DrizzleService } from 'src/database/drizzle.service';
import { getInfoData } from 'src/shared/utils';

import { EmailService } from 'src/services/email/email.service';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { randomBytes } from 'node:crypto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { ProducerService } from 'src/services/kafka/services/producer.service';

@Injectable()
export class UserAuthService extends AuthService{

    constructor(
        jwtService: JwtService,
        drizzleService: DrizzleService,
        private readonly emailService: EmailService,
        producerService: ProducerService,
    ) {
        super(drizzleService,jwtService, producerService);
    };

    // Updated to match your guard expectations
    protected override createTokenPair(accountId: string, deviceId: string, email: string, privateKey: string){
        const accessPayload = {                
            accountId, 
            deviceId,  // Added for guard compatibility
            email,
            role: 'USER',
            tokenType: 'access',
        };
        
        const refreshPayload = {
            accountId,  
            deviceId,
            email,
            role: 'USER',
            tokenType: 'refresh',
        };
        
        const accessToken = this.jwtService.sign(accessPayload, {
            privateKey,              
            algorithm: 'RS256',      
            expiresIn: '1h',         
        })

        const refreshToken = this.jwtService.sign(refreshPayload, {
            privateKey,              
            algorithm: 'RS256',      
            expiresIn: '6h',         
        })
        return {accessToken, refreshToken}
    }

    /**
     * Find user account by email with all related data
     */
    private async findUserAccount(email: string) {
        return this.drizzleService.account.findFirst({
            where: {
                accountType: AccountType.USER,
                authentication: {
                    email: email
                }
            },
            include: {
                authentication: true,
                profile: true,
                userBehavior: true,
                security: true
            }
        });
    }

    /**
     * Find user account by ID
     */
    private async findUserAccountById(accountId: string) {
        return this.drizzleService.account.findFirst({
            where: {
                id: accountId,
                accountType: AccountType.USER
            },
            include: {
                authentication: true,
                profile: true,
                userBehavior: true,
                security: true
            }
        });
    }

    async handleRefreshToken( 
        accountId: string, 
        deviceId: string,
        storedRefreshToken: string 
    ): Promise<{
        accessToken: string,
        refreshToken: string
        update: KeyToken;
        createUsedToken: RefreshTokenUsed; 
    }>{
        if (!accountId || !deviceId || !storedRefreshToken) {
            throw new UnauthorizedException('Invalid refresh token context');
        }

        return await this.drizzleService.$transaction(async (tx) => {
            // Check if token has been used before
            const duplicateJWT = await tx.refreshTokenUsed.findFirst({
                where: { token: storedRefreshToken }
            });

            if(duplicateJWT) {
                // Invalidate all tokens for this account (security measure)
                await tx.keyToken.updateMany({
                    where: { authId: accountId },
                    data: { isActive: false, updatedAt: BigInt(Date.now()) }
                });
                throw new ForbiddenException('Token reuse detected, please login again');
            }

            // Find the key token
            const keyStore = await tx.keyToken.findFirst({
                where: {
                    authId: accountId,
                    deviceId: deviceId,
                    refreshToken: storedRefreshToken,
                    isActive: true
                }
            });

            if(!keyStore) throw new UnauthorizedException('Invalid refresh token');

            const foundUser = await this.findUserAccountById(accountId);
            if(!foundUser) throw new UnauthorizedException('User not registered');

            // Generate new key pair
            const { publicKey, privateKey } = await this.generateKeyPair();
            
            // Updated call signature to match new createTokenPair
            const {accessToken, refreshToken} = this.createTokenPair(
                foundUser.id, 
                deviceId,  // Now includes deviceId
                foundUser.authentication.email, 
                privateKey
            );

            // Update key token
            const update = await tx.keyToken.update({
                where: { id: keyStore.id },
                data: {
                    publicKey,
                    refreshToken,
                    updatedAt: BigInt(Date.now())
                }
            });

            // Create used token record
            const createUsedToken = await tx.refreshTokenUsed.create({
                data: {
                    keyTokenId: keyStore.id,
                    token: storedRefreshToken,
                    reason: 'refresh',
                    createdAt: BigInt(Date.now())
                }
            });

            return {
                accessToken,
                refreshToken,
                update,
                createUsedToken
            };
        });
    };

    async logout ( keyStore: { accountId?: string } ): Promise<any>{
        if (!keyStore?.accountId) {
            throw new UnauthorizedException('Invalid logout context');
        }

        // Deactivate all key tokens for this account
        return await this.drizzleService.keyToken.updateMany({
            where: {
                authId: keyStore.accountId
            },
            data: {
                isActive: false,
                updatedAt: BigInt(Date.now())
            }
        });
    };

    async loginManual(login: LoginUserManualDTO, deviceId: string = crypto.randomUUID()): Promise<{
        user: object;
        accessToken: string;
        refreshToken: string;
    }>{
        const result = await this.drizzleService.$transaction(async (tx) => {
            // Find user by email
            const foundUser = await tx.account.findFirst({
                where: {
                    accountType: AccountType.USER,
                    authentication: { email: login.email }
                },
                include: {
                    authentication: true,
                    profile: true,
                    userBehavior: true,
                    security: true
                }
            });
            
            if(!foundUser) throw new BadRequestException('User not registered');

            // Verify password
            const passwordHashed = await this.hashPassword(login.password, foundUser.authentication.passwordSalt);
            if (passwordHashed !== foundUser.authentication.passwordHash) {
                throw new UnauthorizedException('Wrong password!!!');
            }

            // Generate tokens
            const { publicKey, privateKey } = await this.generateKeyPair();
            
            // Updated call signature to include deviceId
            const {accessToken, refreshToken} = this.createTokenPair(
                foundUser.id, 
                deviceId,  // Now includes deviceId
                foundUser.authentication.email, 
                privateKey
            );
            
            if(!accessToken || !refreshToken) throw new BadGatewayException('Create tokens error!!!!!!');

            // Create/update key store within transaction
            const keyStore = await tx.keyToken.upsert({
                where: {
                    authId_deviceId: {
                        authId: foundUser.id,
                        deviceId
                    }
                },
                update: {
                    publicKey,
                    refreshToken,
                    updatedAt: BigInt(Date.now())
                },
                create: {
                    authId: foundUser.id,
                    deviceId,
                    publicKey,
                    refreshToken,
                    createdAt: BigInt(Date.now()),
                    updatedAt: BigInt(Date.now())
                }
            });

            return {
                user: getInfoData(['id'], foundUser),
                accessToken, 
                refreshToken,
                userId: foundUser.id // Keep for async operations
            };
        });

        // Fire-and-forget metadata update
        setImmediate(async () => {
            try {
                await this.drizzleService.accountAuthentication.update({
                    where: { accountId: result.userId },
                    data: {
                        lastLoginAt: BigInt(Date.now()),
                        loginCount: { increment: 1 },
                        updatedAt: BigInt(Date.now())
                    }
                });
            } catch (error) {
                console.error('Failed to update login metadata:', error);
            }
        });

        // Remove userId from response
        const { userId, ...response } = result;
        return response;
    };

    async forgotPassword(forgotPasswordDto: ForgotPasswordDTO): Promise<{ message: string }> {
        const { email } = forgotPasswordDto;
        
        // Find the user by email
        const user = await this.findUserAccount(email);
        if (!user) {
            // For security reasons, we still return success even if the email doesn't exist
            return { message: 'If your email is registered with us, you will receive a password reset link' };
        }
        
        const resetToken = randomBytes(32).toString('hex');
        const tokenHash = await this.hashPassword(resetToken, 'reset_salt');
        
        // Set token expiration (1 hour from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        await this.drizzleService.passwordReset.create({
            data: {
                authId: user.id,
                token: tokenHash,
                tokenHash,
                requestedAt: new Date(),
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
        const tokenHash = await this.hashPassword(token, 'reset_salt');
        
        return await this.drizzleService.$transaction(async (tx) => {
            const passwordReset = await tx.passwordReset.findFirst({
                where: {
                    tokenHash,
                    isUsed: false,
                    expiresAt: { gt: new Date() }
                }
            });

            if (!passwordReset) {
                throw new BadRequestException('Invalid or expired token');
            }

            // Generate new salt and hash password
            const salt = randomBytes(32).toString('hex');
            const passwordHashed = await this.hashPassword(password, salt);

            // Update token and password in single transaction
            await Promise.all([
                tx.passwordReset.update({
                    where: { id: passwordReset.id },
                    data: {
                        isUsed: true,
                        usedAt: new Date(),
                        attemptCount: { increment: 1 },
                        updatedAt: BigInt(Date.now())
                    }
                }),
                tx.accountAuthentication.update({
                    where: { accountId: passwordReset.authId },
                    data: {
                        passwordHash: passwordHashed,
                        passwordSalt: salt,
                        updatedAt: BigInt(Date.now())
                    }
                })
            ]);

            return { message: 'Password reset successful' };
        });
    }
    
    async validatePasswordResetToken(token: string): Promise<{ valid: boolean }> {
        const tokenHash = await this.hashPassword(token, 'reset_salt');
        const passwordReset = await this.drizzleService.passwordReset.findFirst({
            where: {
                tokenHash,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        });
        
        return { valid: !!passwordReset };
    }

    async findOrCreateGoogleUser(socialData: any, profileData: any) {
        const existingSocial = await this.drizzleService.socialAuthentication.findUnique({
            where: { 
                provider_providerId: {
                    provider: 'google',
                    providerId: socialData.providerId
                }
            },
            include: {
                authentication: {
                    include: {
                        account: true
                    }
                }
            }
        });

        let account: Account;

        if (!existingSocial) {
            const currentTime = BigInt(Date.now());
            
            // Create new user and related entities if social record does not exist
            const result = await this.drizzleService.$transaction(async (tx) => {
                // 1. Create main account
                const newAccount = await tx.account.create({
                    data: {
                        accountType: AccountType.USER,
                        createdAt: currentTime,
                        updatedAt: currentTime
                    }
                });

                // 2. Create authentication
                const newAuth = await tx.accountAuthentication.create({
                    data: {
                        accountId: newAccount.id,
                        email: socialData.email,
                        authMethod: AuthMethod.OAUTH2_ONLY,
                        isVerified: true, // OAuth accounts are pre-verified
                        createdAt: currentTime,
                        updatedAt: currentTime
                    }
                });

                // 3. Create social authentication
                const newSocial = await tx.socialAuthentication.create({
                    data: {
                        authId: newAccount.id,
                        provider: 'google',
                        providerId: socialData.providerId,
                        providerEmail: socialData.email,
                        accessToken: socialData.accessToken,
                        refreshToken: socialData.refreshToken,
                        expiresAt: socialData.expiresAt ? BigInt(socialData.expiresAt) : null,
                        createdAt: currentTime,
                        updatedAt: currentTime
                    }
                });

                // 4. Create profile if data available
                let newProfile = null;
                if (profileData && profileData.name) {
                    newProfile = await tx.accountProfile.create({
                        data: {
                            accountId: newAccount.id,
                            name: profileData.name,
                            avatar: profileData.avatar,
                            language: 'en',
                            createdAt: currentTime,
                            updatedAt: currentTime
                        }
                    });
                }

                // 5. Create user behavior
                await tx.userBehavior.create({
                    data: {
                        accountId: newAccount.id,
                        loyaltyPoints: 0,
                        membershipTier: 'bronze',
                        sex: profileData.sex,
                        dateOfBirth: profileData.dateOfBirth,
                        createdAt: currentTime,
                        updatedAt: currentTime
                    }
                });

                // 6. Create security settings
                await tx.accountSecurity.create({
                    data: {
                        accountId: newAccount.id,
                        roles: ['USER'],
                        permissions: ['user:read', 'user:write'],
                        createdAt: currentTime,
                        updatedAt: currentTime
                    }
                });

                // 7. Create preferences
                await tx.accountPreferences.create({
                    data: {
                        accountId: newAccount.id,
                        createdAt: currentTime,
                        updatedAt: currentTime
                    }
                });

                return { newAccount, newAuth, newSocial, newProfile };
            });

            account = result.newAccount;

            // Create notification thread (outside transaction to avoid complexity)
            await this.drizzleService.notificationThread.create({
                data: { 
                    accountId: result.newAccount.id,
                    createdAt: BigInt(Date.now()),
                    updatedAt: BigInt(Date.now())
                }
            });
        } else {
            // Use existing account
            account = existingSocial.authentication.account;
        }

        // Generate Token Pair
        const { publicKey, privateKey } = await this.generateKeyPair();
        const deviceId = crypto.randomUUID();
        
        // Updated call signature to include deviceId
        const { accessToken, refreshToken } = this.createTokenPair(
            account.id, 
            deviceId,  // Now includes deviceId
            socialData.email, 
            privateKey
        );

        if (!accessToken || !refreshToken) {
            throw new BadGatewayException('Failed to generate tokens');
        }

        // Create key store
        const keyStore = await this.upsertKeyStore(account.id, deviceId, publicKey, refreshToken);
        if (!keyStore) {
            throw new BadGatewayException('Failed to create key store');
        }

        return {
            user: account,
            accessToken,
            refreshToken,
        };
    }
}
