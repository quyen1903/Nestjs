import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateCartDTO, CreateProductDTO } from './dto/create-cart.dto';
import { UpdateCartDTO } from './dto/update-cart.dto';
@Injectable()
export class CartService {
    constructor(
        private readonly prismaService:PrismaService
    ){}

    private async getCart(filter:{}){
        return await this.prismaService.cart.findFirst({
            where:filter
        })
    }

    private async createUserCart ({ userId, product }: CreateCartDTO){
        const cart = await this.prismaService.cart.create({
            data: {
                userId,
                countProduct:1
            },
        });
    
        return this.createCartProduct({cartId:cart.id,product})
    };

    private async createCartProduct({ cartId, product }: {cartId: string, product: CreateProductDTO}){
        const cartExists = await this.prismaService.cart.findUnique({
            where: { id: cartId },
        });
        
        if (!cartExists) {
            throw new Error(`Cart with ID ${cartId} does not exist.`);
        }
        return await this.prismaService.cartProduct.upsert({
            where:{
                cartId_productId: {
                    cartId,
                    productId: product.productId,
                }
            },
            update:{
                quantity: product.quantity,
                name: product.name,
                price: product.price,
                isActive: true
            },
            create:{
                productId: product.productId,
                shopId: product.shopId,
                quantity: product.quantity,
                name: product.name,
                price: product.price,
                cartId: cartId,
                isActive: true
            }
        })
    }

    async addToCart(payload: CreateCartDTO){
        //check cart existed or not, if not, create new cart
        const { userId, product } = {...payload}
        const cart = await this.getCart({userId})

        if(!cart){
            return this.createUserCart({userId, product})
        }

        //check wheather cart has product or not, if not, add product to cart
        const countProductInCart = await this.prismaService.cartProduct.count({
            where: {cartId:cart.id}
        })

        if(countProductInCart === 0){
            return this.createCartProduct({cartId:cart.id,product})
        }

        //check wheather product we're passing is cart existed in cart or not
        const checkCartProduct = await this.prismaService.cartProduct.findUnique({
            where:{
                cartId_productId: {
                    cartId: cart.id,
                    productId: product.productId,
                },
                isActive: true
            }
        })


        if(!checkCartProduct){
            //increase count product by one
            await this.prismaService.cart.update({
                where:{
                    id:cart.id
                },
                data:{
                    countProduct: cart.countProduct +=1
                }
            })
            // add this product to cart
            return this.createCartProduct({cartId:cart.id,product})
        }
    }

    async update({ userId, shopOrderIds }: UpdateCartDTO){
        //loop through each shop
        const cart = await this.getCart({ userId });

        if (!cart) {
            throw new Error("Cart not found for user");
        }

        for(const element of shopOrderIds){
            //loop through each product of shop
            for(const eachShop of element.itemProducts){
                if(!eachShop.oldQuantity) eachShop.oldQuantity = 0;

                const result = await this.prismaService.cartProduct.update({
                    //composite key means we combine more column to establish the uniqueness
                    where: {
                        cartId_productId: {
                            cartId: cart.id,
                            productId: eachShop.productId,
                        },
                    },
                    data:{
                        quantity: {
                            increment: eachShop.quantity - eachShop.oldQuantity
                        }
                    }
                })

                if(result.quantity === 0){
                    await this.prismaService.cartProduct.delete({
                        where:{
                            id: result.id
                        }
                    })
                }
            }
        }
    }

    async deleteUserCart(userId:string, productId: string){
        //delete certain product in carts
        const cart = await this.getCart({userId})

        if (!cart) {
            throw new Error("Cart not found for user");
        }
        await this.prismaService.cart.update({
            where:{
                userId
            },
            data:{  
                countProduct: cart.countProduct -= 1
            }
        })
        const deleteCart = await this.prismaService.cartProduct.delete({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: productId,
                },
            },
          })
          
        return deleteCart          
    }

    async getListUserCart(userId: string){
        const cart = await this.getCart({userId})

        return await this.prismaService.cartProduct.findMany({
            where:{
                cartId:cart?.id
            }
        })
        
    }
}
