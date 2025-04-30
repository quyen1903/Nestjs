import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { DiscountService } from '../discount/discount.service';
import { CheckoutDTO, ItemProductDTO, ShopOrderIdDTO } from './dto/checkout.dto';
import { Factory } from '../product/services/factory.service';
import { ShopCheckout } from './interface';
import { Cart, OrderStatus, OrderItem } from '@prisma/client';

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
        
            try {
                const newOrder = await this.prismaService.$transaction(async (tx) => {
                    const orderItemPromises: Promise<OrderItem>[]  = []; // Array to hold all the promises for creating order items
        
                    for (const ShopCheckout of reviewedOrders) {
                        const itemPromises = ShopCheckout.itemProducts.map(async (item) => {
                            // Lock inventory row for update
                            const inventory = await tx.inventory.findUnique({
                                where: { inventoryProductId: item.productId },
                                select: { id: true, inventoryStock: true },
                            });
        
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
        
                            // Create order item entry
                            orderItemPromises.push(
                                tx.orderItem.create({
                                    data: {
                                        orderId: "", // This will be set once the order is created
                                        inventoryId: inventory.id,
                                        quantity: item.quantity,
                                        price: item.price, // Assume price is passed from item
                                    }
                                })
                            );
                        });
        
                        // Wait for all itemPromises for this shop to complete
                        await Promise.all(itemPromises);
                    }
        
                    // Create the order after handling all items
                    const createdOrder = await tx.order.create({
                        data: {
                            userId: userId,
                            status: OrderStatus.PENDING,
                            totalDiscount: checkoutOrder.totalDiscount,
                            shippingFee: checkoutOrder.feeShip,
                            shippingAddress: 'test', // Replace with real shipping address
                            paymentInfo: {},
                            paymentIntentId: null,
                            totalPrice: checkoutOrder.totalPrice,
                            expiredAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiration
                        }
                    });
        
                    // Once order is created, update order items with the correct order ID
                    await Promise.all(orderItemPromises.map(promise => promise.then(item => item.orderId = createdOrder.id)));
        
                    // Clear the cart
                    await this.cartService.clearCart(cartId);
        
                    return createdOrder;
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