import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { IKeyToken } from "src/shared/interfaces/keyToken.interface";
import crypto from 'node:crypto';
import { Shop,Status } from "@prisma/client";
@Injectable()
export class KeyTokenService {
    constructor(private readonly prismaService: PrismaService){}
        
    // async createKeyToken({ accountId, publicKey, refreshToken, roles }: IKeyToken) : Promise<KeyToken> {
    //     return this.prismaService.keyToken.upsert({
    //         where: { accountId },
    //         update: { publicKey, refreshToken, isActive: true },
    //         create: { accountId, publicKey, refreshToken, roles, isActive: true },
    //     });
    // }

    // async findByAccountId(accountId: string): Promise<KeyToken | null> {
    //     const result = await this.prismaService.keyToken.findUnique({
    //         where: {
    //             accountId,
    //         },
    //     });
    //     return result
    // }

    // async removeKeyByAccountID(accountId: string) : Promise<KeyToken | null> {
    //     const keyToken = await this.findByAccountId(accountId);
    //     if (!keyToken) throw new NotFoundException("KeyToken not found");

    //     return this.prismaService.keyToken.delete({
    //         where: { id: keyToken.id },
    //     });
    // }

    // async findByRefreshToken(refreshToken: string) : Promise<KeyToken | null> {
    //     return this.prismaService.keyToken.findFirst({
    //         where: { refreshToken },
    //     });
    // }

    // async findByUsedRefreshToken(token: string): Promise<RefreshTokenUsed | null>  {
    //     return this.prismaService.refreshTokenUsed.findFirst({
    //         where: { token },
    //     });
    // }

    async createAPIKey(id: Shop['id']){
        return await this.prismaService.aPIkey.create({
            data:{
                key:crypto.randomBytes(64).toString('hex'),
                status: Status.ACTIVE,
                shopId:id,
                permission:['0000'],
                isActive: true
            }
        })
    }
}
