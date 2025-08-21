import { Controller, Req, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { Factory } from './services/factory.service';
import { ProductService } from './services/product.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { Roles } from '../auth/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { ShopAuthGuard } from '../auth/shop-auth/auth-jwt.guard';
import { CreateBrandDTO, CreateSkuDTO, CreateSpuDTO } from './dto/request-product.dto';

@Controller('product')
export class ProductController {
    constructor(
        private readonly factory: Factory,
        private readonly productService: ProductService
    ) {}

    @Post('create_product')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    createProduct( 
        @Body() spu: CreateSpuDTO, 
        @Body() sku: CreateSkuDTO, 
        @AuthRequest('account') account: JWTdecode 
    ) {
        return this.productService.createProduct(spu, sku, account.accountId);
    }

    @Post('create_brand')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    createBrand(@Body() body: CreateBrandDTO){
        return this.productService.createBrand(body)
    }

    @Post('create_category')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    createCategory(@Body() body: {name: string, parentId?: string}){
        return this.productService.createCategory(body.name, body.parentId)
    }

    

    // @Patch(':productId')
    // @UseGuards(ShopAuthGuard, RoleGuard)
    // @Roles(Role.Shop)
    // updateProduct( @Param('productId') productId: string, @Body() updateProductDTO: UpdateProductDTO, @AuthRequest('account') account: JWTdecode ) {
    //     return this.factory.updateProduct( updateProductDTO.productType, productId,{
    //             ...updateProductDTO, 
    //             productShopId: account.accountId
    //         }
    //     );
    // }

    // @Post('publish/:id')
    // @UseGuards(ShopAuthGuard, RoleGuard)
    // @Roles(Role.Shop)
    // publishProduct(@Param('id') productId: string, @AuthRequest('account') account: JWTdecode) {
    //     return this.factory.publishProductByShop({ 
    //         productShopId: account.accountId,
    //         uuid: productId
    //     })
    // }

    // @Post('unpublish/:id')
    // @UseGuards(ShopAuthGuard, RoleGuard)
    // @Roles(Role.Shop)
    // unpublishProduct(@Param('id') productId: string, @AuthRequest('account') account: JWTdecode){
    //     return this.factory.unPublishProductByShop({
    //         productShopId: account.accountId,
    //         uuid: productId
    //     })
    // }

    // @Get('drafts/all')
    // @UseGuards(ShopAuthGuard, RoleGuard)
    // @Roles(Role.Shop)
    // getAllDraftForShop(@AuthRequest('account') account: JWTdecode){
    //     return this.factory.findAllDraftsForShop({
    //         productShopId: account.accountId
    //     })
    // }

    // @Get('published/all')
    // @UseGuards(ShopAuthGuard, RoleGuard)
    // @Roles(Role.Shop)
    // getAllPublishForShop(@AuthRequest('account') account: JWTdecode){
    //     return this.factory.findAllPublishForShop({
    //         productShopId: account.accountId
    //     })
    // }

    // @Get('search/:keySearch')
    // getListSearchProduct(@Param('keySearch') keySearch: string){
    //     return this.factory.getListSearchProduct(keySearch)
    // }

    // @Get('')
    // findAllProducts(@Req() req){
    //     return this.factory.findAllProducts(req.query)
    // }

    // @Get(':productId')
    // findProduct( @Param('productId') productId: string){
    //     return this.factory.findProduct(productId)
    // }
}
