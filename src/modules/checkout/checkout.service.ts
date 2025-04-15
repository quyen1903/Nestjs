import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { DiscountService } from '../discount/discount.service';
import { CheckoutDTO, ItemProductDTO, ShopOrderIdDTO } from './dto/checkout.dto';
import { Factory } from '../product/services/factory.service';
import { ItemCheckout } from './interface';
import { Cart } from '@prisma/client';
import Redis from 'ioredis';

@Injectable()
export class CheckoutService {
    private redis: Redis;

    constructor(
        private readonly prismaService:PrismaService,
        private readonly cartService:CartService,
        private readonly discountService:DiscountService, 
        private readonly factory: Factory
    ){
        this.redis = new Redis('redis://localhost:6379');
    }

    async checkoutReview({ cartId, userId, shopOrderIds}: CheckoutDTO){
        //check cart id existed?
        const cart: Cart = await this.cartService.getCartMethod({id: cartId});
        if(!cart) throw new BadRequestException('Cart does not existed!!');

        /**
         * user can buy many product from many shop
         * checkout will return array of product and price
         */
        
        const shopOrderIdsIsNew: ItemCheckout[] = [];
        
        const checkoutOrder = {
            totalPrice:0,
            feeShip:0,
            totalDiscount:0,
            totalCheckout:0
        }

        //total bill fee
        for(let i = 0; i < shopOrderIds.length; i++){
            const {shopId, shopDiscounts, itemProducts} = shopOrderIds[i]
            /**
             * check product available
             * it return price, quantity and productId
             * checkProductByServerMethod use Promise.all 
             * how Promise.all work? we pass array of promise to Promise.all
             * Promise.all return a single promise, which return fulfilled if all 
             * promise are fulfilled and return reject if only one promise return reject
             * this means if one product in request body are not valid, whole checkProductServer
             * constant will return null/undefined
            */
            const checkProductServer:ItemProductDTO[] = await this.factory.checkProductByServerMethod(itemProducts);
            if(!checkProductServer[0]) throw new BadRequestException('order wrong !!!');
            
            //total fee order
            const checkoutPrice: number = checkProductServer.reduce((accumulate: number, product: ItemProductDTO)=>{
                return accumulate +(product.quantity * product.price)
            },0)

            /**
             * total money before processing
            */
            checkoutOrder.totalPrice += checkoutPrice

            //push to new shop_orders_ids_new
            const itemCheckout = {
                shopId,
                shopDiscounts,
                priceRaw: checkoutPrice,
                priceApplyDiscount: checkoutPrice,
                itemProducts: checkProductServer
            }

            //if shop_discounts > 0, check wheather valid
            let discount = 0;
            if (shopDiscounts.length > 0){
                for(let i = 0; i<shopDiscounts.length; i++){
                    const result = await this.discountService.getDiscountAmount({
                        discountCode:shopDiscounts[0].codeId,
                        discountUserId:userId,
                        discountShopId:shopId,
                        discountProducts: checkProductServer
                    })
                    discount += result.discount
                }

                //total discount amout
                checkoutOrder.totalDiscount += discount

                //if discount greater than zero
                if(discount>0){
                    itemCheckout.priceApplyDiscount = checkoutPrice - discount
                }
            }
            //total final fee
            checkoutOrder.totalCheckout += itemCheckout.priceApplyDiscount
            shopOrderIdsIsNew.push(itemCheckout)
        }
        return{
            shopOrderIds,
            shopOrderIdsIsNew,  
            checkoutOrder
        }
    }

    async orderByUser(
        shopOrderIds: ShopOrderIdDTO[],
        cartId: string,
        userId: string,
        userAddress: object,
        userPayment: object
    ) {
        const { shopOrderIdsIsNew, checkoutOrder } = await this.checkoutReview({
            cartId,
            userId,
            shopOrderIds
        });
    
        try {
            const newOrder = await this.prismaService.$transaction(async (tx) => {
                for (const order of shopOrderIdsIsNew) {
                    for (const item of order.itemProducts) {
                        const { productId, quantity } = item;
    
                        // Lock row using SELECT FOR UPDATE
                        const inventory = await tx.$queryRaw<
                            { id: string, inventoryStock: number }[]
                        >`
                            SELECT id, "inventory_stock"
                            FROM "inventories"
                            WHERE "inventory_product_id" = ${productId}
                            FOR UPDATE
                        `;
    
                        if (!inventory || inventory.length === 0) {
                            throw new BadRequestException(`Inventory not found for product ${productId}`);
                        }
    
                        const { id, inventoryStock } = inventory[0];
    
                        if (inventoryStock < quantity) {
                            throw new BadRequestException(`Not enough stock for product ${productId}`);
                        }
    
                        await tx.inventory.update({
                            where: { id },
                            data: {
                                inventoryStock: { decrement: quantity },
                                updatedAt: BigInt(Date.now())
                            }
                        });
                    }
                }
    
                const createdOrder = await tx.order.create({
                    data: {
                        orderUserId: userId,
                        orderCheckout: checkoutOrder,
                        orderShipping: userAddress,
                        orderPayment: userPayment,
                        orderProduct: shopOrderIdsIsNew as any
                    }
                });
    
                await this.cartService.clearCart(cartId);
                return createdOrder;
            });
    
            return newOrder;
        } catch (error) {
            throw error;
        }
    }
        

    async getOrdersByUser(){

    }

    async getOneOrdersByUser(){
        
    }

    async cancelOrderByUser(){
        
    }

    async updateOrdersByUser(){
        
    }
        
}
