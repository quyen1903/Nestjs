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
                        shopBusinessId: shopCheckout.shopId, // ✅ Required field
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

                    // Create order item
                    await tx.orderItem.create({
                        data: {
                            orderId: order.id, // ✅ Now we have the order ID
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

        

    async getOrdersByUser() {}

    async getOneOrdersByUser() {}

    async cancelOrderByUser() {}

    async updateOrdersByUser() {}
}