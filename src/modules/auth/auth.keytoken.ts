import { Injectable, NotFoundException } from "@nestjs/common";
import { DrizzleService } from "src/database/drizzle.service";
import { KeyToken, RefreshTokenUsed } from "src/database/types";
@Injectable()
export abstract class ShopKeyTokenService {
    constructor(private readonly drizzleService: DrizzleService){}
        
    /**
     * Upsert key token for shop account with device support
     */
    async upsertShopKeyToken({ 
        accountId, 
        deviceId, 
        publicKey, 
        refreshToken 
    }: {
        accountId: string,
        deviceId: string,
        publicKey: string,
        refreshToken: string
    }): Promise<KeyToken> {
        const currentTime = BigInt(Date.now());
        
        return this.drizzleService.keyToken.upsert({
            where: { 
                authId_deviceId: {
                    authId: accountId,
                    deviceId: deviceId
                }
            },
            update: { 
                publicKey, 
                refreshToken, 
                isActive: true,
                updatedAt: currentTime
            },
            create: { 
                authId: accountId,
                deviceId,
                publicKey, 
                refreshToken, 
                isActive: true,
                createdAt: currentTime,
                updatedAt: currentTime
            },
        });
    }

    /**
     * Find key token by account ID (returns all active tokens for the account)
     */
    async findByAccountId(accountId: string): Promise<KeyToken[]> {
        return this.drizzleService.keyToken.findMany({
            where: {
                authId: accountId,
                isActive: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    /**
     * Find specific key token by account ID and device ID
     */
    async findByAccountIdAndDeviceId(accountId: string, deviceId: string): Promise<KeyToken | null> {
        return this.drizzleService.keyToken.findFirst({
            where: {
                authId: accountId,
                deviceId: deviceId,
                isActive: true
            },
        });
    }

    /**
     * Remove all key tokens for an account (logout from all devices)
     */
    async removeKeyByAccountID(accountId: string): Promise<{ count: number }> {
        const currentTime = BigInt(Date.now());
        
        return this.drizzleService.keyToken.updateMany({
            where: { 
                authId: accountId,
                isActive: true
            },
            data: {
                isActive: false,
                updatedAt: currentTime
            }
        });
    }

    /**
     * Remove specific key token by device (logout from specific device)
     */
    async removeKeyByAccountIdAndDeviceId(accountId: string, deviceId: string): Promise<KeyToken | null> {
        const keyToken = await this.findByAccountIdAndDeviceId(accountId, deviceId);
        if (!keyToken) throw new NotFoundException("KeyToken not found");

        const currentTime = BigInt(Date.now());

        return this.drizzleService.keyToken.update({
            where: { id: keyToken.id },
            data: {
                isActive: false,
                updatedAt: currentTime
            }
        });
    }

    /**
     * Find key token by refresh token
     */
    async findByRefreshToken(refreshToken: string): Promise<KeyToken | null> {
        return this.drizzleService.keyToken.findFirst({
            where: { 
                refreshToken,
                isActive: true
            },
        });
    }

    /**
     * Find used refresh token record
     */
    async findByUsedRefreshToken(token: string): Promise<RefreshTokenUsed | null> {
        return this.drizzleService.refreshTokenUsed.findFirst({
            where: { token },
        });
    }

    /**
     * Create used token record
     */
    async createUsedTokenRecord(
        keyTokenId: string, 
        token: string, 
        reason?: string,
        userAgent?: string,
        ipAddress?: string,
        deviceInfo?: string
    ): Promise<RefreshTokenUsed> {
        const currentTime = BigInt(Date.now());

        return this.drizzleService.refreshTokenUsed.create({
            data: {
                keyTokenId,
                token,
                reason,
                userAgent,
                ipAddress,
                deviceInfo,
                createdAt: currentTime,
                updatedAt: currentTime
            }
        });
    }

    /**
     * Clean up expired tokens
     */
    async cleanupExpiredTokens(): Promise<{ count: number }> {
        const currentTime = BigInt(Date.now());

        return this.drizzleService.keyToken.updateMany({
            where: {
                expiresAt: {
                    lt: currentTime
                },
                isActive: true
            },
            data: {
                isActive: false,
                updatedAt: currentTime
            }
        });
    }

    /**
     * Get active session count for an account
     */
    async getActiveSessionCount(accountId: string): Promise<number> {
        return this.drizzleService.keyToken.count({
            where: {
                authId: accountId,
                isActive: true
            }
        });
    }

    /**
     * Get all active sessions for an account with details
     */
    async getActiveSessionsWithDetails(accountId: string): Promise<KeyToken[]> {
        return this.drizzleService.keyToken.findMany({
            where: {
                authId: accountId,
                isActive: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
    }

    /**
     * Revoke all sessions except current one
     */
    async revokeOtherSessions(accountId: string, currentDeviceId: string): Promise<{ count: number }> {
        const currentTime = BigInt(Date.now());

        return this.drizzleService.keyToken.updateMany({
            where: {
                authId: accountId,
                deviceId: {
                    not: currentDeviceId
                },
                isActive: true
            },
            data: {
                isActive: false,
                updatedAt: currentTime
            }
        });
    }
}
