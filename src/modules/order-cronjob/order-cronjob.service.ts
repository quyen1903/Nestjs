import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrderStatus } from 'src/database/types';
import { DrizzleService } from 'src/database/drizzle.service';

@Injectable()
export class OrderCronjobService {
    constructor(
        private readonly drizzleService:DrizzleService
    ){}

    @Cron(' */15 * * * *') //run every 15 minutess
    async handleExpiredOrder(){
        const expiredOrder = await this.drizzleService.order.findMany({
            where:{ 
                status: OrderStatus.PENDING,
                expiredAt: { lte: new Date}
            },
            include:{
                orderItems: true
            }
        });

        for(const order of expiredOrder){
            await this.drizzleService.$transaction(async (tx)=>{
                await tx.order.update({
                    where: {id: order.id},
                    data:{ status: OrderStatus.CANCELLED}
                })

                for(const item of order.orderItems){
                    const reservation = await tx.reservationInventory.findFirst({
                        where:{
                            inventoryId: item.inventoryId,
                            userId: order.userId,
                            valid: true,
                            isConfirmed: false
                        }
                    })

                    if(reservation){
                        // set inventory reservation to invalid
                        await tx.reservationInventory.update({
                            where: {id: reservation.id},
                            data: {valid: false}
                        })

                        //return stock
                        await tx.inventory.update({
                            where:{id: item.inventoryId },
                            data:{ inventoryStock:{ increment: reservation.quantity }}
                        })
                    }
                }
            })
        }
    }
}
