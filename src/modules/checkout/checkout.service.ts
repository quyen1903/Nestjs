import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { DiscountService } from '../discount/discount.service';
import { CheckoutDTO, ItemProductDTO, ShopOrderIdDTO } from './dto/checkout.dto';
import { Factory } from '../product/services/factory.service';
import { ShopCheckout } from './interface';
import { Cart } from '@prisma/client';

@Injectable()
export class CheckoutService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly cartService: CartService,
        private readonly discountService: DiscountService,
        private readonly factory: Factory
    ) {}

    async checkoutReview({ cartId, userId, shopOrderIds }: CheckoutDTO) {
        return this.prismaService.$transaction(async (tx)=>{
            const cart: Cart = await this.cartService.getCartMethod({ id: cartId });
            if (!cart) throw new BadRequestException('Cart does not existed!!');
    
            const reviewedOrders: ShopCheckout[] = [];
            const checkoutOrder = {
                totalPrice: 0,
                feeShip: 0,
                totalDiscount: 0,
                totalCheckout: 0
            };
    
            for (const { shopId, shopDiscounts, itemProducts } of shopOrderIds) {
                const checkProductServer: ItemProductDTO[] = await this.factory.checkProductByServerMethod(itemProducts);
                if (!checkProductServer[0]) throw new BadRequestException('order wrong !!!');
    
                for (const product of checkProductServer) {
                    // Using FOR UPDATE to lock the row
                    const inventory = await tx.$queryRaw`
                        SELECT * FROM inventories 
                        WHERE inventory_product_id = ${product.productId} 
                        FOR UPDATE`;
                    
                    if (!inventory || inventory[0].inventory_stock < product.quantity) {
                        throw new BadRequestException(`Not enough stock for product ID ${product.productId}`);
                    }
                }
    
                const checkoutPrice: number = checkProductServer.reduce((acc, product) => acc + (product.quantity * product.price), 0);
                checkoutOrder.totalPrice += checkoutPrice;
    
                const itemCheckout: ShopCheckout = {
                    shopId,
                    shopDiscounts,
                    priceRaw: checkoutPrice,
                    priceApplyDiscount: checkoutPrice,
                    itemProducts: checkProductServer
                };
    
                let discount = 0;
                if (shopDiscounts.length > 0) {
                    for (let i = 0; i < shopDiscounts.length; i++) {
                        const result = await this.discountService.getDiscountAmount({
                            discountCode: shopDiscounts[i].codeId,
                            discountUserId: userId,
                            discountShopId: shopId,
                            discountProducts: checkProductServer
                        });
                        discount += result.discount;
                    }
    
                    checkoutOrder.totalDiscount += discount;
                    if (discount > 0) {
                        itemCheckout.priceApplyDiscount = checkoutPrice - discount;
                    }
                }
    
                checkoutOrder.totalCheckout += itemCheckout.priceApplyDiscount;
                reviewedOrders.push(itemCheckout);
            }
    
            return {
                shopOrderIds,
                reviewedOrders,
                checkoutOrder
            };
        })

    }

    async createOrderByUser(
        shopOrderIds: ShopOrderIdDTO[],
        cartId: string,
        userId: string,
    ) {
        const { reviewedOrders, checkoutOrder } = await this.checkoutReview({
            cartId,
            userId,
            shopOrderIds
        });

        try {
            const newOrder = await this.prismaService.$transaction(async (tx) => {
                for (const ShopCheckout of reviewedOrders) {
                    for (const item of ShopCheckout.itemProducts) {

                        const inventory = await tx.inventory.findUnique({
                            where: { inventoryProductId: item.productId },
                            select: { id: true },
                          });
                      
                        await tx.reservationInventory.create({
                            data:{
                                userId,
                                inventoryId: inventory.id,
                                quantity: item.quantity,
                                expiredAt: new Date(Date.now() + 5 * 60 * 1000),
                                isConfirmed: false,
                                valid: true            
                            }
                        })

                        await tx.inventory.update({
                            where: {id: inventory.id},
                            data:{ inventoryStock: {decrement: item.quantity} }
                        })
                    }
                }

                // const createdOrder = await tx.order.create({
                //     data: {
                //         orderUserId: userId,
                //         orderCheckout: checkoutOrder,   
                //         orderShipping: userAddress,
                //         orderPayment: userPayment,
                //         orderProduct: reviewedOrders as any,
                //         orderStatus: 'PENDING'
                //     }
                // });

                // await this.cartService.clearCart(cartId);
                // return createdOrder;
            });

            return newOrder;
        } catch (error) {
            throw error;
        }
    }

    async getOrdersByUser() {}

    async getOneOrdersByUser() {}

    async cancelOrderByUser() {}

    async updateOrdersByUser() {}
}