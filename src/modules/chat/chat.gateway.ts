import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ChatService } from './chat.service';
import { MessageType } from '@prisma/client';
  
@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private userSockets = new Map<string, string>(); // userId -> socketId
    private shopSockets = new Map<string, string>(); // shopId -> socketId
  
    constructor(
        private prismaService: PrismaService,
        private chatService: ChatService,
    ) {}
  
    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token;
            if (!token) {
                client.disconnect();
                return;
            }

            // Verify token and get user/shop info
            const payload = await this.chatService.verifyToken(token);
            if (!payload) {
                client.disconnect();
                return;
            }
    
            // Store connection based on role
            if (payload.role === 'USER') {
                this.userSockets.set(payload.id, client.id);
                // Join user room
                client.join(`user-${payload.id}`);
            } else if (payload.role === 'SHOP') {
            this.shopSockets.set(payload.id, client.id);
            // Join shop room
            client.join(`shop-${payload.id}`);
            } else {
            client.disconnect();
            }
        } catch (error) {
            client.disconnect();
        }
    }
  
    handleDisconnect(client: Socket) {
      // Remove disconnected client from maps
        for (const [userId, socketId] of this.userSockets.entries()) {
            if (socketId === client.id) {
                this.userSockets.delete(userId);
                break;
            }
        }
    
        for (const [shopId, socketId] of this.shopSockets.entries()) {
            if (socketId === client.id) {
                this.shopSockets.delete(shopId);
                break;
            }
        }
    }
  
    @SubscribeMessage('user-to-shop')
    async handleUserToShopMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        payload: {
            content: string;
            shopId: string;
            userId: string;
        },
    ) {
        try {
            // Store message in database
            const message = await this.chatService.createMessage({
                content: payload.content,
                senderId: payload.userId,
                receiverId: payload.shopId,
                type: MessageType.USER_TO_SHOP,
            });
    
            // Emit to specific shop
            this.server.to(`shop-${payload.shopId}`).emit('new-message', {
                messageId: message.id,
                content: message.content,
                senderId: message.senderId,
                type: message.type,
                createdAt: message.createdAt,
            });
    
            return { success: true, messageId: message.id };
        } catch (error) {
            return { success: false, error: 'Failed to send message' };
        }
    }
  
    @SubscribeMessage('shop-to-user')
    async handleShopToUserMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        payload: {
            content: string;
            userId: string;
            shopId: string;
        },
    ) {
      try {
        // Store message in database
        const message = await this.chatService.createMessage({
          content: payload.content,
          senderId: payload.shopId,
          receiverId: payload.userId,
          type: MessageType.SHOP_TO_USER,
        });
  
        // Emit to specific user
        this.server.to(`user-${payload.userId}`).emit('new-message', {
          messageId: message.id,
          content: message.content,
          senderId: message.senderId,
          type: message.type,
          createdAt: message.createdAt,
        });
  
        return { success: true, messageId: message.id };
      } catch (error) {
        return { success: false, error: 'Failed to send message' };
      }
    }
  
    @SubscribeMessage('get-conversation')
    async getConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { userId?: string; shopId?: string }
    ) {
        try {
            if (!payload.userId || !payload.shopId) return { success: false, error: 'Missing user or shop ID' };
            
            const messages = await this.chatService.getConversation(payload.userId,payload.shopId);
            return { success: true, messages };
        } catch (error) {
            return { success: false, error: 'Failed to fetch conversation' };
        }
    }
  
    @SubscribeMessage('mark-as-read')
    async markMessagesAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { messageIds: string[] },
    ) {
        try {
            if (!payload.messageIds?.length) return { success: false, error: 'No message IDs provided' };
            await this.chatService.markMessagesAsRead(payload.messageIds);
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to mark messages as read' };
        }
    }
}