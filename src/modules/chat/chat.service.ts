import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MessageType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
interface MessageDto {
  content: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
}

@Injectable()
export class ChatService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
    ) {}

    async verifyToken(token: string) {
        try {
            return this.jwtService.verify(token);
        } catch {
            return null;
        }
    }

    async createMessage(messageDto: MessageDto) {
        return this.prismaService.message.create({
            data: {
                content: messageDto.content,
                senderId: messageDto.senderId,
                receiverId: messageDto.receiverId,
                type: messageDto.type,
            },
        });
    }

    async getConversation(userId: string, shopId: string) {
        return this.prismaService.message.findMany({
            where: {
                OR: [
                    {
                        senderId: userId,
                        receiverId: shopId,
                        type: MessageType.USER_TO_SHOP,
                    },
                    {
                        senderId: shopId,
                        receiverId: userId,
                        type: MessageType.SHOP_TO_USER,
                    },
                ],
                isActive: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    async markMessagesAsRead(messageIds: string[]) {
        return this.prismaService.message.updateMany({
            where: {
                id: {in: messageIds}
            },
            data: {
                isRead: true,
                updatedAt: new Date(),
            }
        });
    }

    async getUnreadMessageCount(userId: string, isShop: boolean) {
        if (isShop) {
        return this.prismaService.message.count({
            where: {
                receiverId: userId,
                type: MessageType.USER_TO_SHOP,
                isRead: false,
                isActive: true,
            },
        });
        } else {
        return this.prismaService.message.count({
            where: {
                receiverId: userId,
                type: MessageType.SHOP_TO_USER,
                isRead: false,
                isActive: true,
            },
        });
        }
    }

    async getUsersWithMessages(shopId: string) {
        // Get unique users who have sent messages to this shop
        const userMessages = await this.prismaService.message.findMany({
        where: {
            receiverId: shopId,
            type: MessageType.USER_TO_SHOP,
            isActive: true,
        },
        select: {
            senderId: true,
        },
        distinct: ['senderId'],
        });

        // Get user details for each sender
        const userIds = userMessages.map((msg) => msg.senderId);
        return this.prismaService.user.findMany({
        where: {
            id: {
            in: userIds,
            },
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            avatar: true,
        },
        });
    }

    async getShopsWithMessages(userId: string) {
        // Get unique shops who have sent messages to this user
        const shopMessages = await this.prismaService.message.findMany({
        where: {
            receiverId: userId,
            type: MessageType.SHOP_TO_USER,
            isActive: true,
        },
        select: {
            senderId: true,
        },
        distinct: ['senderId'],
        });

        // Get shop details for each sender
        const shopIds = shopMessages.map((msg) => msg.senderId);
        return this.prismaService.shop.findMany({
        where: {
            id: {
            in: shopIds,
            },
            isActive: true,
        },
        select: {
            id: true,
            name: true,
        },
        });
    }
}