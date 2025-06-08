import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { IKeyToken } from "src/shared/interfaces/keyToken.interface";
import { UserKeyToken, UserRefreshTokenUsed } from '@prisma/client';
import crypto from 'node:crypto'
@Injectable()
export class UserKeyTokenService {
    constructor(private readonly prismaService: PrismaService){}
        
    async createKeyToken({ accountId, publicKey, refreshToken, roles }: IKeyToken) : Promise<UserKeyToken> {
        return this.prismaService.shopKeyToken.upsert({
            where: { accountId },
            update: { publicKey, refreshToken, isActive: true },
            create: { accountId, publicKey, refreshToken, roles, isActive: true },
        });
    }

    async findByAccountId(accountId: string): Promise<UserKeyToken | null> {
        const result = await this.prismaService.shopKeyToken.findUnique({
            where: {
                accountId,
            },
        });
        return result
    }

    async removeKeyByAccountID(accountId: string) : Promise<UserKeyToken | null> {
        const keyToken = await this.findByAccountId(accountId);
        if (!keyToken) throw new NotFoundException("KeyToken not found");

        return this.prismaService.shopKeyToken.delete({
            where: { id: keyToken.id },
        });
    }

    async findByRefreshToken(refreshToken: string) : Promise<UserKeyToken | null> {
        return this.prismaService.shopKeyToken.findFirst({
            where: { refreshToken },
        });
    }

    async findByUsedRefreshToken(token: string): Promise<UserRefreshTokenUsed | null>  {
        return this.prismaService.shopRefreshTokenUsed.findFirst({
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
