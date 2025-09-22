import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProducerService } from 'src/services/kafka/services/producer.service';
import { JwtService } from '@nestjs/jwt';
import { LoginShopDTO } from './dto/login.dto';
import { AuthService } from '../auth.service';
import { AccountType, KeyToken } from '@prisma/client';
import { getInfoData } from 'src/shared/utils';

@Injectable()
export class ShopAuthService extends AuthService {
    constructor(
        prismaService: PrismaService,
        jwtService: JwtService,
        producerService: ProducerService,
    ) {
        super(prismaService, jwtService, producerService);
    }

    protected override createTokenPair(accountId: string, deviceId: string, email: string, privateKey: string) {
        const payload = {
            accountId,
            deviceId,
            email,
            role: 'SHOP',
            permissions: ['order:read', 'order:write']
        };

        const accessToken = this.jwtService.sign(payload, {
            privateKey,
            algorithm: 'RS256',
            expiresIn: '1h',
        });

        const refreshToken = this.jwtService.sign(payload, {
            privateKey,
            algorithm: 'RS256',
            expiresIn: '6h',
        });

        return { accessToken, refreshToken };
    }

    async handleRefreshToken(
        shopId: string, 
        deviceId: string,
        requestRefreshToken: string
    ): Promise<{
        accessToken: string;
        refreshToken: string;
        update: any;
        createUsedToken: any;
    }> {
        return await this.prismaService.$transaction(async (tx) => {
            // Check if token has been used before
            const duplicateJWT = await tx.refreshTokenUsed.findFirst({
                where: { token: requestRefreshToken }
            });

            if (duplicateJWT) {
                // Invalidate all tokens for this account (security measure)
                await tx.keyToken.updateMany({
                    where: { authId: shopId },
                    data: { isActive: false, updatedAt: BigInt(Date.now()) }
                });
                throw new ForbiddenException('Token reuse detected, please login again');
            }

            // Find the key token
            const keyStore = await tx.keyToken.findFirst({
                where: {
                    authId: shopId,
                    deviceId: deviceId,
                    refreshToken: requestRefreshToken,
                    isActive: true
                }
            });

            if (!keyStore) throw new UnauthorizedException('Invalid refresh token');

            const foundShop = await tx.account.findFirst({
                where: {
                    id: shopId,
                    accountType: AccountType.SHOP
                },
                include: {
                    authentication: true,
                    profile: true,
                    shopBusiness: true,
                    security: true
                }
            });
            
            if (!foundShop) throw new UnauthorizedException('Shop not registered');

            // Generate new key pair
            const { publicKey, privateKey } = this.generateKeyPair();
            const { accessToken, refreshToken } = this.createTokenPair(
                foundShop.id,
                deviceId,
                foundShop.authentication.email, 
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
                    token: requestRefreshToken,
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
    }

    async logout(keyStore: KeyToken): Promise<any> {
        // Remove all key tokens for this account
        return await this.prismaService.keyToken.updateMany({
            where: {
                authId: keyStore.authId,
                deviceId: keyStore.deviceId
            },
            data: {
                isActive: false,
                updatedAt: BigInt(Date.now())
            }
        });
    };

    /**
     * 1 check whether shop existed or not
     * 2 verify password
     * 3 handle device
     * 4 update login metadata
     * 
     * @param login please check logins shop data transfer object
     * @returns 
     */
    async login(login: LoginShopDTO): Promise<{
        shop: object;
        accessToken: string;
        refreshToken: string;
    }> {
        const result = await this.prismaService.$transaction(async (tx) => {
            // 1. Check if shop exists
            const foundShop = await tx.account.findFirst({
                where: {
                    accountType: AccountType.SHOP,
                    authentication: { email: login.email }
                },
                include: {
                    authentication: true,
                    profile: true,
                    security: true,
                    deviceSession: true
                }
            });

            if (!foundShop) throw new BadRequestException('Shop not registered');

            // 2. Verify password
            const passwordHashed = await this.hashPassword(login.password, foundShop.authentication.passwordSalt);
            if (passwordHashed !== foundShop.authentication.passwordHash) {
                throw new UnauthorizedException('Wrong password!!!');
            }

            // 3. Handle device data (simplified with upsert)
            let deviceId = login.deviceId || crypto.randomUUID();
            
            await tx.deviceSession.upsert({
                where: { deviceId },
                update: { 
                    updatedAt: BigInt(Date.now()) 
                },
                create: {
                    deviceId,
                    accountId: foundShop.id,
                    createdAt: BigInt(Date.now()),
                    updatedAt: BigInt(Date.now())
                }
            });

            // 5. Generate key pair and tokens
            const { publicKey, privateKey } = this.generateKeyPair();
            const { accessToken, refreshToken } = this.createTokenPair(
                foundShop.id, 
                deviceId, 
                foundShop.authentication.email, 
                privateKey
            );

            // 6. Create/update key store (per device)
            const keyStore = await tx.keyToken.upsert({
                where: {
                    authId_deviceId: {
                        authId: foundShop.id,
                        deviceId
                    }
                },
                update: {
                    publicKey,
                    refreshToken,
                    updatedAt: BigInt(Date.now())
                },
                create: {
                    authId: foundShop.id,
                    deviceId,
                    publicKey,
                    refreshToken,
                    createdAt: BigInt(Date.now()),
                    updatedAt: BigInt(Date.now())
                }
            });

            if (!keyStore) throw new Error('Cannot generate keytoken');

            return {
                shop: getInfoData(['id'], foundShop),
                accessToken,
                refreshToken,
                shopId: foundShop.id,
                shopName: foundShop.profile?.name || 'Shop'
            };
        });

        // 4. Fire-and-forget metadata update (async)
        setImmediate(async () => {
            try {
                await this.prismaService.accountAuthentication.update({
                    where: { accountId: result.shopId },
                    data: {
                        lastLoginAt: BigInt(Date.now()),
                        loginCount: { increment: 1 },
                        updatedAt: BigInt(Date.now())
                    }
                });
            } catch (error) {
                console.error('Failed to update shop login metadata:', error);
            }
        });

        // 7. Fire-and-forget notification
        setImmediate(async () => {
            try {
                await this.producerService.produce({
                    topic: 'login',
                    messages: [{
                        value: `${result.shopName} has logged into our system`
                    }]
                });
            } catch (error) {
                console.error('Failed to send login notification:', error);
            }
        });

        // Remove internal fields from response
        const { shopId, shopName, ...response } = result;
        return response;
    }
}
