import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { DiscountService } from '../discount/discount.service';
import { CheckoutDTO, ItemProductDTO, ShopOrderIdDTO } from './dto/checkout.dto';
import { ProductService } from '../product/product.service';
import { ShopCheckout } from './interface';
import { Cart, OrderStatus, OrderItem } from '@prisma/client';

@Injectable()
export class CheckoutService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly cartService: CartService,
        private readonly discountService: DiscountService,
        private readonly productService: ProductService
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
                const checkProductServer: ItemProductDTO[] = await this.productService.checkProductByServer(itemProducts);
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
    /*
        we create order before user actually pay money
        so once we create order in database, we need to keep track
        on time miles which order has been create, once it fail after 15 minutes,
        we cancel  
    */
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

        return await this.prismaService.$transaction(async (tx) => {
            const createdOrders = []; // Array to store multiple orders (one per shop)

            for (const shopCheckout of reviewedOrders) {
                // Create order for each shop
                const order = await tx.order.create({
                    data: {
                        userId: userId,
                        shopBusinessId: shopCheckout.shopId, //Required field
                        status: OrderStatus.PENDING,
                        totalDiscount: shopCheckout.priceRaw - shopCheckout.priceApplyDiscount,
                        shippingFee: 0, // You can calculate this per shop
                        shippingAddress: 'test', // Replace with actual address
                        paymentInfo: {},
                        paymentIntentId: null,
                        totalPrice: shopCheckout.priceApplyDiscount,
                        expiredAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiration
                    }
                });

                // Create order items for this shop
                for (const item of shopCheckout.itemProducts) {
                    const inventory:{ id: string; inventoryStock: number;} = await tx.$queryRaw
                        `SELECT id, inventoryStock 
                        FROM Inventory 
                        WHERE inventoryProductId = ${item.productId}
                        FOR UPDATE`
                    ;

                    if (!inventory || inventory.inventoryStock < item.quantity) {
                        throw new BadRequestException(`Not enough stock for product ID ${item.productId}`);
                    }

                    // Create reservation inventory
                    await tx.reservationInventory.create({
                        data: {
                            userId,
                            inventoryId: inventory.id,
                            quantity: item.quantity,
                            expiredAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiration
                            isConfirmed: false,
                            valid: true,
                        },
                    });

                    // Update inventory stock
                    await tx.inventory.update({
                        where: { id: inventory.id },
                        data: { inventoryStock: { decrement: item.quantity } },
                    });

                    // Create order item
                    await tx.orderItem.create({
                        data: {
                            orderId: order.id, //Now we have the order ID
                            inventoryId: inventory.id,
                            quantity: item.quantity,
                            price: item.price,
                        }
                    });
                }

                createdOrders.push(order);
            }

            // Clear the cart after all orders are created
            await this.cartService.clearCart(cartId);

            return {
                orders: createdOrders,
                totalOrders: createdOrders.length,
                message: 'Orders created successfully'
            };
        });
    }

        

    async getOrdersByUser(
        userId: string,
        page: number = 1,
        limit: number = 10,
        status?: OrderStatus
    ) {
        const skip = (page - 1) * limit;
        
        const whereClause = {
            userId: userId,
            isActive: true,
            ...(status && { status })
        };

        const [orders, totalCount] = await Promise.all([
            this.prismaService.order.findMany({
                where: whereClause,
                include: {
                    orderItems: {
                        include: {
                            inventory: {
                                include: {
                                    inventoryProduct: {
                                        include: {
                                            spu: {
                                                select: {
                                                    name: true,
                                                    images: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    shopBusiness: {
                        include: {
                            account: {
                                include: {
                                    profile: {
                                        select: {
                                            name: true,
                                            avatar: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            this.prismaService.order.count({
                where: whereClause
            })
        ]);

        return {
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                hasNext: page * limit < totalCount,
                hasPrev: page > 1
            }
        };
    }

    async getOneOrdersByUser(orderId: string, userId: string) {
        const order = await this.prismaService.order.findFirst({
            where: {
                id: orderId,
                userId: userId,
                isActive: true
            },
            include: {
                orderItems: {
                    include: {
                        inventory: {
                            include: {
                                inventoryProduct: {
                                    include: {
                                        spu: {
                                            select: {
                                                id: true,
                                                name: true,
                                                images: true,
                                                intro: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                shopBusiness: {
                    include: {
                        account: {
                            include: {
                                profile: {
                                    select: {
                                        name: true,
                                        avatar: true,
                                        phone: true,
                                        address: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            throw new BadRequestException('Order not found or access denied');
        }

        return order;
    }

    async cancelOrderByUser(orderId: string, userId: string, reason?: string) {
        return await this.prismaService.$transaction(async (tx) => {
            // First, verify the order exists and belongs to the user
            const order = await tx.order.findFirst({
                where: {
                    id: orderId,
                    userId: userId,
                    isActive: true
                },
                include: {
                    orderItems: {
                        include: {
                            inventory: true
                        }
                    }
                }
            });

            if (!order) {
                throw new BadRequestException('Order not found or access denied');
            }

            // Check if order can be cancelled
            if (order.status === OrderStatus.DELIVERED) {
                throw new BadRequestException('Cannot cancel a delivered order');
            }

            if (order.status === OrderStatus.CANCELLED) {
                throw new BadRequestException('Order is already cancelled');
            }

            if (order.status === OrderStatus.SHIPPED) {
                throw new BadRequestException('Cannot cancel a shipped order. Please contact support.');
            }

            // Update order status to cancelled
            const cancelledOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.CANCELLED,
                    updatedAt: BigInt(Date.now())
                }
            });

            // Restore inventory stock for each order item
            for (const orderItem of order.orderItems) {
                // Restore inventory stock using FOR UPDATE to prevent race conditions
                await tx.$queryRaw`
                    UPDATE inventories 
                    SET inventory_stock = inventory_stock + ${orderItem.quantity},
                        updated_at = ${BigInt(Date.now())}
                    WHERE id = ${orderItem.inventoryId}
                `;

                // Cancel any existing reservations for this order
                await tx.reservationInventory.updateMany({
                    where: {
                        userId: userId,
                        inventoryId: orderItem.inventoryId,
                        valid: true
                    },
                    data: {
                        valid: false,
                        updatedAt: BigInt(Date.now())
                    }
                });
            }

            // Optional: Log the cancellation reason
            // You could create a separate table for order status history
            
            return {
                order: cancelledOrder,
                message: `Order ${orderId} has been successfully cancelled`,
                restoredItems: order.orderItems.length
            };
        });
    }

    async updateOrdersByUser(
        orderId: string, 
        userId: string, 
        updateData: {
            shippingAddress?: string;
            // Add other fields users should be allowed to update
        }
    ) {
        return await this.prismaService.$transaction(async (tx) => {
            // First, verify the order exists and belongs to the user
            const existingOrder = await tx.order.findFirst({
                where: {
                    id: orderId,
                    userId: userId,
                    isActive: true
                }
            });

            if (!existingOrder) {
                throw new BadRequestException('Order not found or access denied');
            }

            // Check if order can be updated
            if (existingOrder.status === OrderStatus.DELIVERED) {
                throw new BadRequestException('Cannot update a delivered order');
            }

            if (existingOrder.status === OrderStatus.CANCELLED) {
                throw new BadRequestException('Cannot update a cancelled order');
            }

            if (existingOrder.status === OrderStatus.SHIPPED) {
                throw new BadRequestException('Cannot update shipping address for a shipped order');
            }

            // Only allow certain fields to be updated by users
            const allowedUpdates: any = {};
            
            if (updateData.shippingAddress && updateData.shippingAddress.trim()) {
                allowedUpdates.shippingAddress = updateData.shippingAddress.trim();
            }

            // Add validation if needed
            if (Object.keys(allowedUpdates).length === 0) {
                throw new BadRequestException('No valid fields provided for update');
            }

            // Update the order
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    ...allowedUpdates,
                    updatedAt: BigInt(Date.now())
                },
                include: {
                    orderItems: {
                        include: {
                            inventory: {
                                include: {
                                    inventoryProduct: {
                                        include: {
                                            spu: {
                                                select: {
                                                    name: true,
                                                    images: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    shopBusiness: {
                        include: {
                            account: {
                                include: {
                                    profile: {
                                        select: {
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return {
                order: updatedOrder,
                message: 'Order updated successfully'
            };
        });
    }
}