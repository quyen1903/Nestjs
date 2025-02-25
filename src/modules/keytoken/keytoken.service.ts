import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { IKeyToken } from "src/shared/interfaces/keyToken.interface";
import { KeyToken } from "@prisma/client";
import { RefreshTokenUsed } from "@prisma/client";
import crypto from 'node:crypto'
@Injectable()
export class KeyTokenService {
    constructor(private readonly prismaService: PrismaService){}
        
    async createKeyToken({ accountId, publicKey, refreshToken, roles }: IKeyToken) : Promise<KeyToken> {
        return this.prismaService.keyToken.upsert({
            where: { accountId },
            update: { publicKey, refreshToken, isActive: true },
            create: { accountId, publicKey, refreshToken, roles, isActive: true },
        });
    }

    async findByAccountId(accountId: string): Promise<KeyToken | null> {
        const result = await this.prismaService.keyToken.findUnique({
            where: {
                accountId,
            },
        });
        return result
    }

    async removeKeyByAccountID(accountId: string) : Promise<KeyToken | null> {
        const keyToken = await this.findByAccountId(accountId);
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

    async findByUsedRefreshToken(token: string): Promise<RefreshTokenUsed | null>  {
        return this.prismaService.refreshTokenUsed.findFirst({
            where: { token },
        });
    }

    async createAPIKey(){
        return await this.prismaService.aPIkey.create({
            data:{
                key:crypto.randomBytes(64).toString('hex'),
                status:true,
                permission:['0000'],
                isActive: true
            }
        })
    }
}
