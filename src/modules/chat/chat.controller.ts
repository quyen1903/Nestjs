import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth-jwt.guard';
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
    constructor(private chatService: ChatService) {}

    @Get('unread-count')
    async getUnreadCount(@Req() req) {
        return this.chatService.getUnreadMessageCount(req.user.id, req.user.role === 'SHOP');
    }

    @Get('conversation/:partnerId')
    async getConversation(@Req() req, @Param('partnerId') partnerId: string) {
        if (req.user.role === 'SHOP') {
            return this.chatService.getConversation(partnerId, req.user.id);
        } else {
            return this.chatService.getConversation(req.user.id, partnerId);
        }
    }

    @Get('contacts')
    async getContacts(@Req() req) {
        if (req.user.role === 'SHOP') {
            return this.chatService.getUsersWithMessages(req.user.id);
        } else {
            return this.chatService.getShopsWithMessages(req.user.id);
        }
    }
}