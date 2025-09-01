import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { KeyTokenService } from 'src/modules/keytoken/keytoken.service';
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

    protected override createTokenPair(accountId: string, email: string, privateKey: string) {
        const payload = {
            accountId,
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
        // Check if token has been used before
        const duplicateJWT = await this.prismaService.refreshTokenUsed.findFirst({
            where: { token: requestRefreshToken }
        });
    
        const foundShop = await this.prismaService.account.findFirst({
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

        if (duplicateJWT) throw new ForbiddenException('Something wrong happened, please relogin');

        // Find the key token
        const keyStore = await this.prismaService.keyToken.findFirst({
            where: {
                authId: shopId,
                deviceId: deviceId,
                refreshToken: requestRefreshToken,
                isActive: true
            }
        });

        if (!keyStore) throw new UnauthorizedException('Something was wrong happened, please relogin');

        // Generate new key pair
        const { publicKey, privateKey } = this.generateKeyPair();
        const { accessToken, refreshToken } = this.createTokenPair(
            foundShop.id, 
            foundShop.authentication.email, 
            privateKey
        );
    
        // Update key token
        const update = await this.prismaService.keyToken.update({
            where: { id: keyStore.id},
            data: {
                publicKey,
                refreshToken,
                updatedAt: BigInt(Date.now())
            }
        });
    
        // Create used token record
        const createUsedToken = await this.prismaService.refreshTokenUsed.create({
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

    async login(login: LoginShopDTO, deviceId: string = crypto.randomUUID()): Promise<{
        shop: object;
        accessToken: string;
        refreshToken: string;
    }> {
        // Check if shop exists
        const foundShop = await this.prismaService.account.findFirst({
            where: {
                accountType: AccountType.SHOP,
                authentication: {
                email: login.email
                }
            },
            include: {
                authentication: true,
                profile: true,
                shopBusiness: true,
                security: true
            }
        });

        if (!foundShop) throw new BadRequestException('Shop not registered');

        // Verify password
        const passwordHashed = await this.hashPassword(login.password, foundShop.authentication.passwordSalt);
        if (passwordHashed !== foundShop.authentication.passwordHash) throw new UnauthorizedException('Wrong password!!!');
        

        // Update login metadata
        await this.prismaService.accountAuthentication.update({
        where: {
            accountId: foundShop.id
        },
        data: {
            lastLoginAt: BigInt(Date.now()),
            loginCount: { increment: 1 },
            updatedAt: BigInt(Date.now())
        }
        });

        // Generate key pair and tokens
        const { publicKey, privateKey } = this.generateKeyPair();
        const { accessToken, refreshToken } = this.createTokenPair(foundShop.id, foundShop.authentication.email, privateKey );

        // Create/update key store
        const keyStore = await this.prismaService.keyToken.upsert({
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

        // Send notification
        await this.producerService.produce({
            topic: 'login',
            messages: [{
                value: `${foundShop.profile?.name || 'Shop'} has logged into our system`
            }]
        });

        return {
            shop: getInfoData(['id'], foundShop),
            accessToken,
            refreshToken
        };
    }
}
