import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { KeyToken, DeviceSession, RefreshTokenUsed } from "@prisma/client";
@Injectable()
export class KeyTokenService {
    constructor(private readonly prismaService: PrismaService){}
        
    async upsertShopKeyToken({ authId, deviceId, publicKey, refreshToken }: {
        authId: KeyToken['authId'],
        deviceId: KeyToken['deviceId']
        publicKey: KeyToken['publicKey'],
        refreshToken: KeyToken['refreshToken'],
    }) : Promise<KeyToken> {
        return this.prismaService.keyToken.upsert({
            where: { 
                authId_deviceId: { authId, deviceId } 
            },
            update: { publicKey, refreshToken, isActive: true },
            create: { authId,deviceId, publicKey, refreshToken, isActive: true },
        });
    }

    async findByAccountId(authId: string, deviceId: string): Promise<KeyToken | null> {
        const result = await this.prismaService.keyToken.findUnique({
            where: {
                authId_deviceId: { authId, deviceId } 
            }
        });
        return result
    }

    async removeKeyByAccountID(authId: string, deviceId: string) : Promise<KeyToken | null> {
        const keyToken = await this.findByAccountId(authId, deviceId);
        if (!keyToken) throw new NotFoundException("KeyToken not found");

        return this.prismaService.keyToken.delete({
            where: { id: keyToken.id },
        });
    }

    async findByRefreshToken(refreshToken: string) : Promise<KeyToken | null> {
        return this.prismaService.keyToken.findFirst({
            where: { refreshToken },
        });
    }

    async findByUsedRefreshToken(token: string): Promise< RefreshTokenUsed | null>  {
        return this.prismaService.refreshTokenUsed.findFirst({
            where: { token },
        });
    }

}