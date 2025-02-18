import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { IKeyToken } from "src/shared/interfaces/keyToken.interface";

@Injectable()
export class KeyTokenService {
    constructor(private readonly prismaService: PrismaService){}
    
    async createKeyToken({ accountId, publicKey, refreshToken, roles }: IKeyToken) {
        return await this.prismaService.keyToken.upsert({
            where: { accountId },
            update: { publicKey, refreshToken },
            create: { accountId, publicKey, refreshToken, roles },
        });
    }

    async findByAccountId(accountId: string) {
        return await this.prismaService.keyToken.findUnique({
            where: { accountId },
        });
    }

    async removeKeyByAccountID(accountId: string) {
        const keyToken = await this.findByAccountId(accountId);
        if (!keyToken) throw new NotFoundException("KeyToken not found");

        return await this.prismaService.keyToken.delete({
            where: { id: keyToken.id },
        });
    }

    async findByRefreshToken(refreshToken: string) {
        return await this.prismaService.keyToken.findFirst({
            where: { refreshToken },
        });
    }

    async findByUsedRefreshToken(token: string) {
        return await this.prismaService.refreshTokenUsed.findFirst({
            where: { token },
        });
    }
}
