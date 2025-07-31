import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserKeyTokenService } from './user-auth/user-auth.keytoken';
import * as crypto from 'crypto';
import { Sex, User, UserProfile, UserSocial, UserSocialProvider } from '@prisma/client';
import { BadGatewayException } from '@nestjs/common';
import { ProducerService } from 'src/services/kafka/services/producer.service';
@Injectable()
export class AuthService {
    constructor(
        protected readonly prismaService: PrismaService,
        protected readonly jwtService: JwtService,
        // private readonly userKeyTokenService: UserKeyTokenService,
        protected readonly producerService: ProducerService
    ) {};

    /**
     * 
     * @param password original password
     * @param salt random string
     * @returns hashed password, which had been add salt to hash, almost impossible to brute force
    */
    hashPassword(password:string, salt:string):Promise<string> {
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
    protected generateKeyPair(): {
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

    protected createTokenPair(id: string, email: string, privateKey: string){
        const payload = {                
            accountId:id, 
            email,
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
    };

    // protected async upsertKeyStore(accountId: string, publicKey: string, refreshToken: string){
    //     return await this.userKeyTokenService.createKeyToken({
    //         accountId,
    //         publicKey,
    //         refreshToken,
    //         roles: 'USER'
    //     })
    // };

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