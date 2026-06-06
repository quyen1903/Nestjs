import { Body, Controller, Delete, Post,Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CreateCartDTO } from './dto/create-cart.dto';
import { UpdateCartDTO } from './dto/update-cart.dto';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';

@Controller('cart')
@ApiTags('Cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}


    @Post('')
    @ApiEndpoint({
        summary: 'Add a product to cart',
        body: { type: CreateCartDTO },
        responses: [{ status: 201, description: 'Product added to cart' }],
    })
    addToCart(@Body() payload: CreateCartDTO){
        return this.cartService.addToCart(payload)
    }

    @Post('update')
    @ApiEndpoint({
        summary: 'Update cart item quantities',
        body: { type: UpdateCartDTO },
        responses: [{ status: 201, description: 'Cart updated' }],
    })
    update(@Body() payload: UpdateCartDTO){
        return this.cartService.update(payload)
    }

    @Delete('')
    @ApiEndpoint({
        summary: 'Remove a product from cart',
        body: {
            schema: {
                type: 'object',
                required: ['userId', 'productId'],
                properties: {
                    userId: { type: 'string', example: 'user_123' },
                    productId: { type: 'string', example: 'sku_123' },
                },
            },
        },
    })
    delete(@Body() payload: {userId:string, productId: string}){
        return this.cartService.deleteUserCart(payload.userId, payload.productId)
    }

    @Get('')
    @ApiEndpoint({
        summary: 'List cart items by user',
        queries: [{ name: 'userId', required: true, example: 'user_123' }],
    })
    listToCart(@Query('userId') userId: string){
        return this.cartService.getListUserCart(userId)
    }
}
