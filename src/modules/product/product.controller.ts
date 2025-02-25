import { Req,Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { Factory } from './services/factory.service';
import { CreateProductDTO } from './dto/create-product.dto';
import { UpdateProductDTO } from './dto/update-product.dto';
import { AuthGuard } from '../auth/auth-jwt.guard';
import { AuthRequestDTO } from '../auth/dto/auth-request.dto';

@UseGuards(ApiKeyGuard)
@Controller('product')
export class ProductController {
    constructor(private readonly factory: Factory) {}

    @Post('')
    @UseGuards(AuthGuard)
    createProduct( @Body() body: CreateProductDTO, @Req() req: AuthRequestDTO ) {
        return this.factory.createProduct(body.productType, {
            ...body, 
            productShopId: req.account.accountId
        });
    }

    @Patch(':productId')
    @UseGuards(AuthGuard)
    updateProduct( @Param('productId') productId: string, @Body() body: UpdateProductDTO, @Req() req: AuthRequestDTO ) {
        return this.factory.updateProduct( body.productType, productId,{
                ...body, 
                productShopId:  req.account.accountId
            }
        );
    }

    @Post('publish/:id')
    @UseGuards(AuthGuard)
    publishProduct(@Param('id') productId: string, @Req() req: AuthRequestDTO) {
        return this.factory.publishProductByShop({ 
            productShopId: req.account.accountId,
            uuid: productId
        })
    }

    @Post('unpublish/:id')
    @UseGuards(AuthGuard)
    unpublishProduct(@Param('id') productId: string, @Req() req:AuthRequestDTO){
        return this.factory.unPublishProductByShop({
            productShopId: req.account.accountId,
            uuid: productId
        })
    }
}
