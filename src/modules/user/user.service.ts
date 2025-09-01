import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, BadGatewayException} from '@nestjs/common';
import crypto from 'crypto';
import { RegisterUserDTO } from '../auth/user-auth/dto/register.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getInfoData } from 'src/shared/utils';
import { KeyTokenService } from '../keytoken/keytoken.service';
import { EmailService } from 'src/services/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { AccountType, AuthMethod } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { ProducerService } from 'src/services/kafka/services/producer.service';

@Injectable()
export class UserService extends AuthService{
    constructor(
        jwtService: JwtService,
        prismaService: PrismaService,
        producerService: ProducerService,
        
    ) {
            super(prismaService, jwtService, producerService);
    };

    async registerManual(register: RegisterUserDTO) {
        // Check if user already exists
        const userHolder = await this.prismaService.account.findFirst({
            where: {
                accountType: AccountType.USER,
                authentication: {
                    email: register.email
                }
            },
            include: {
                authentication: true,
                profile: true,
                userBehavior: true,
                security: true
            }
        });

        if(userHolder) throw new BadGatewayException('User already exists');

        const currentTime = BigInt(Date.now());
        const salt = crypto.randomBytes(32).toString('hex');
        const passwordHashed = await this.hashPassword(register.password, salt);

        /**
         * Use transaction to create user with all related data
         * This ensures user registration creates all necessary records atomically
         */
        const result = await this.prismaService.$transaction(async(tx) => {
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
                data:{
                    accountId: newAccount.id,
                    username: register.username,
                    email: register.email,
                    passwordHash: passwordHashed,
                    passwordSalt: salt,
                    authMethod: AuthMethod.EMAIL_PASSWORD,
                    createdAt: currentTime,
                    updatedAt: currentTime
                }
            });

            // 3. Create profile
            const newProfile = await tx.accountProfile.create({
                data:{
                    accountId: newAccount.id,
                    name: register.name,
                    phone: register.phone,
                    address: register.address,
                    language: register.language || 'en',
                    createdAt: currentTime,
                    updatedAt: currentTime
                }
            });

            // 4. Create user behavior data
            const newUserBehavior = await tx.userBehavior.create({
                data: {
                    accountId: newAccount.id,
                    loyaltyPoints: 0,
                    membershipTier:"bronze",
                    preferences: {},
                    dateOfBirth: register.dateOfBirth,
                    createdAt: currentTime,
                    updatedAt: currentTime
                }
            });

            // 5. Create security settings
            await tx.accountSecurity.create({
                data: {
                    accountId: newAccount.id,
                    roles: ['USER'],
                    permissions: ['user:read', 'user:write'],
                    createdAt: currentTime,
                    updatedAt: currentTime
                }
            });

            // 6. Create preferences
            await tx.accountPreferences.create({
                data: {
                    accountId: newAccount.id,
                    language: register.language || 'en',
                    currency: register.currency || 'USD',
                    createdAt: currentTime,
                    updatedAt: currentTime
                }
            });

            return { newAccount, newAuth, newProfile, newUserBehavior };
        });

        if(result){
            const { privateKey, publicKey } = this.generateKeyPair();
            const {accessToken, refreshToken} = this.createTokenPair(
                result.newAccount.id, 
                result.newAuth.email, 
                privateKey
            )
            if(!accessToken || !refreshToken) throw new BadGatewayException('Create tokens error!!!!!!')

            const deviceId = crypto.randomUUID();
            const keyStore = await this.upsertKeyStore(result.newAccount.id, deviceId, publicKey, refreshToken)
            if(!keyStore) throw new Error('Cannot generate keytoken');

            // Create notification thread
            const notificationThread = await this.prismaService.notificationThread.create({
                data:{
                    accountId: result.newAccount.id,
                    createdAt: currentTime,
                    updatedAt: currentTime
                }
            })

            return{
                user: getInfoData(['id'], result.newAccount),
                notificationThread,
                accessToken,
                refreshToken
            }
        }
        
        return {
            code: 500,
            metadata: 'Registration failed'
        }  
    }

}
