import { Controller, Req, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { Factory } from './services/factory.service';
import { CreateProductDTO } from './dto/create-product.dto';
import { UpdateProductDTO } from './dto/update-product.dto';
import { AuthGuard } from '../auth/auth-jwt.guard';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { IJWTdecode } from 'src/shared/interfaces/jwt.interface';

@UseGuards(ApiKeyGuard)
@Controller('product')
export class ProductController {
    constructor(private readonly factory: Factory) {}

    @Post('')
    @UseGuards(AuthGuard)
    createProduct( @Body() createProductDTO: CreateProductDTO, @AuthRequest('account') account: IJWTdecode ) {
        return this.factory.createProduct(createProductDTO.productType, {
            ...createProductDTO, 
            productShopId: account.accountId
        });
    }

    @Patch(':productId')
    @UseGuards(AuthGuard)
    updateProduct( @Param('productId') productId: string, @Body() updateProductDTO: UpdateProductDTO, @AuthRequest('account') account: IJWTdecode ) {
        return this.factory.updateProduct( updateProductDTO.productType, productId,{
                ...updateProductDTO, 
                productShopId: account.accountId
            }
        );
    }

    @Post('publish/:id')
    @UseGuards(AuthGuard)
    publishProduct(@Param('id') productId: string, @AuthRequest('account') account: IJWTdecode) {
        return this.factory.publishProductByShop({ 
            productShopId: account.accountId,
            uuid: productId
        })
    }

    @Post('unpublish/:id')
    @UseGuards(AuthGuard)
    unpublishProduct(@Param('id') productId: string, @AuthRequest('account') account: IJWTdecode){
        return this.factory.unPublishProductByShop({
            productShopId: account.accountId,
            uuid: productId
        })
    }

    @Get('drafts/all')
    @UseGuards(AuthGuard)
    getAllDraftForShop(@AuthRequest('account') account: IJWTdecode){
        return this.factory.findAllDraftsForShop({
            productShopId: account.accountId
        })
    }

    @Get('published/all')
    @UseGuards(AuthGuard)
    getAllPublishForShop(@AuthRequest('account') account: IJWTdecode){
        return this.factory.findAllPublishForShop({
            productShopId: account.accountId
        })
    }

    @Get('search/:keySearch')
    getListSearchProduct(@Param('keySearch') keySearch: string){
        return this.factory.getListSearchProduct(keySearch)
    }

    @Get('')
    findAllProducts(@Req() req){
        return this.factory.findAllProducts(req.query)
    }

    @Get(':productId')
    findProduct( @Param('productId') productId: string){
        return this.factory.findProduct(productId)
    }
}
