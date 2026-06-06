import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
import { NotificationType } from 'src/database/types';
@Injectable()
export class NotificationFactoryService {
    private readonly logger = new Logger(NotificationFactoryService.name);

    constructor(private readonly drizzleService: DrizzleService) {}

    async createProductNotification(data: {
        productId: string;
        productName: string;
        shopId: string;
        shopName: string;
    }) {
        return this.createNotificationsForAllUsers({
            type: 'PRODUCT',
            senderId: data.shopId,
            content: `New product "${data.productName}" added by ${data.shopName}`,
            productId: data.productId,
        });
    }

    async createDiscountNotification(data: {
        discountId: string;
        discountName: string;
        discountValue: number;
        shopId: string;
        shopName: string;
    }) {
        return this.createNotificationsForAllUsers({
            type: 'DISCOUNT',
            senderId: data.shopId,
            content: `New discount "${data.discountName}" with ${data.discountValue}% off from ${data.shopName}`,
            discountId: data.discountId,
        });
    }

    private async createNotificationsForAllUsers(notificationData: {
        type: NotificationType;
        senderId: string;
        content: string;
        productId?: string;
        discountId?: string;
    }) {
        try {
            // Get all notification threads to notify users
            const notificationThreads = await this.drizzleService.notificationThread.findMany({
                where: { isActive: true }
            });

            this.logger.log(
                `Creating ${notificationData.type} notifications for ${notificationThreads.length} users`
            );

            // Batch create notifications for better performance
            const notificationsToCreate = notificationThreads.map(thread => ({
                type: notificationData.type,
                senderId: notificationData.senderId,
                threadId: thread.id,
                content: notificationData.content,
                productId: notificationData.productId || null,
                discountId: notificationData.discountId || null,
                option: {},
            }));

            // Use transaction for atomicity
            const result = await this.drizzleService.$transaction(async (db) => {
                for (const notification of notificationsToCreate) {
                    await db.notification.create({ data: notification });
                }
                return notificationsToCreate.length;
            });

            this.logger.log(`Successfully created ${result} notifications`);
            return result;
        } catch (error) {
            this.logger.error(
                `Error creating ${notificationData.type} notifications: ${error instanceof Error? error.message: String(error)}`,
                error instanceof Error? error.stack : undefined
            );
            throw error;
        }
    }
}
