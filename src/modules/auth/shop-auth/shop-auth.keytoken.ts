import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { IKeyToken } from "src/shared/interfaces/keyToken.interface";
import { Shop, ShopKeyToken, ShopRefreshTokenUsed } from "@prisma/client";

@Injectable()
export class ShopKeyTokenService {
    constructor(private readonly prismaService: PrismaService){}
        
    async upsertShopKeyToken({ accountId, publicKey, refreshToken, roles }: {
        accountId: Shop['id'],
        publicKey: ShopKeyToken['publicKey'],
        refreshToken: ShopKeyToken['refreshToken'],
        roles: ShopKeyToken['roles']
    }) : Promise<ShopKeyToken> {
        return this.prismaService.shopKeyToken.upsert({
            where: { sub:accountId },
            update: { publicKey, refreshToken, isActive: true },
            create: { sub:accountId, publicKey, refreshToken, roles, isActive: true },
        });
    }

    async findByAccountId(accountId: string): Promise<ShopKeyToken | null> {
        const result = await this.prismaService.shopKeyToken.findUnique({
            where: {
                sub:accountId,
            },
        });
        return result
    }

    async removeKeyByAccountID(accountId: string) : Promise<ShopKeyToken | null> {
        const keyToken = await this.findByAccountId(accountId);
        if (!keyToken) throw new NotFoundException("KeyToken not found");

        return this.prismaService.shopKeyToken.delete({
            where: { id: keyToken.id },
        });
    }

    async findByRefreshToken(refreshToken: string) : Promise<ShopKeyToken | null> {
        return this.prismaService.shopKeyToken.findFirst({
            where: { refreshToken },
        });
    }

    async findByUsedRefreshToken(token: string): Promise<ShopRefreshTokenUsed | null>  {
        return this.prismaService.shopRefreshTokenUsed.findFirst({
            where: { token },
        });
    }

}