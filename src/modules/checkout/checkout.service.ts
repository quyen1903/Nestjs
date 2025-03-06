import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { DiscountService } from '../discount/discount.service';
import { CheckoutDTO, ItemProductDTO, ShopOrderIdDTO } from './dto/checkout.dto';
import { Factory } from '../product/services/factory.service';
import { ItemCheckout } from './interface';

@Injectable()
export class CheckoutService {
    constructor(
        private readonly prismaService:PrismaService,
        private readonly cartService:CartService,
        private readonly discountService:DiscountService, 
        private readonly factory: Factory
    ){}

    async checkoutReview({ cartId, userId, shopOrderIds}: CheckoutDTO){
        //check cart id existed?
        const cart = await this.cartService.getCartMethod({id: cartId});
        if(!cart) throw new BadRequestException('Cart does not existed!!');

        /**
         * user can buy many product from many shop
         * checkout will return array of product and price
         *  
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
            checkoutOrder.totalPrice =+ checkoutPrice

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
                for(let i = 0; i<=shopDiscounts.length; i++){
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

    // async orderByUser( 
    //     shopOrderIds: ShopOrderIdDTO[],
    //     cartId: string,
    //     userId:string,
    //     userAddress: object,
    //     userPayment: object
    // ){
    //     const {shopOrderIdsIsNew, checkoutOrder} = await this.checkoutReview({cartId, userId, shopOrderIds});
    //     const products = shopOrderIdsIsNew.flatMap(order => order.itemProducts);

    //     console.log(`[1]`, products)
    //     const accquireProduct: any[] = []
    //     for (let i = 0; i< products.length; i++){
    //         const { productId, quantity } = products[i];
    //         const keyLock = await acquireLock(productId, quantity, cartId);
    //         accquireProduct.push( keyLock ? true : false)
    //         if(keyLock){
    //             await releaseLock(keyLock)
    //         }
    //     }

    //     if(accquireProduct.includes(false)){
    //         throw new BadRequestException('some product has been updated')
    //     }

    //     const newOrder = await this.prismaService.order.create({
    //         data:{
    //             orderUserId: userId,
    //             orderCheckout: checkoutOrder,
    //             orderShipping:userAddress,
    //             orderPayment:userPayment,
    //             orderProduct:shopOrderIdsIsNew
    //         }
    //     })

    //     //if insert success, remove product inside cart
    //     if(newOrder) 
    //     return newOrder
    // }
        
}
