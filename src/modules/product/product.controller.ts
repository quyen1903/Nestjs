import { Controller, Req, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { Roles } from '../auth/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { ShopAuthGuard } from '../auth/shop-auth/auth-jwt.guard';
import { CreateBrandDTO, CreateSkuDTO, CreateSpuDTO, CreateProductDTO, CreateCategoryDTO } from './dto/request-product.dto';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';

// Add this DTO for update operations
export class UpdateProductDTO extends CreateSpuDTO {
    // Inherits all fields from CreateSpuDTO but makes them optional for updates
}

@Controller('product')
export class ProductController {
    constructor(
        private readonly productService: ProductService
    ) {}

    @Post('create_product')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    @ApiOperation({ summary: 'Create a new product with SPU and SKU' })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    createProduct(
        @Body() createProductDto: CreateProductDTO,
        @AuthRequest('account') account: JWTdecode
    ) {
        return this.productService.createProduct(
            createProductDto.spu, 
            createProductDto.sku, 
            account.accountId
        );
    }


    @Post('create_brand')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    createBrand(@Body() body: CreateBrandDTO) {
        return this.productService.createBrand(body);
    }

    @Post('create_category')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    createCategory(@Body() createCategoryDto: CreateCategoryDTO) {
        return this.productService.createCategory(
            createCategoryDto.name, 
            createCategoryDto.parentId
        );
    }


    @Patch(':productId')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    updateProduct(
        @Param('productId') productId: string,
        @Body() updateProductDTO: Partial<CreateSpuDTO & CreateSkuDTO>,
        @AuthRequest('account') account: JWTdecode
    ) {
        return this.productService.updateProduct(productId, updateProductDTO);
    }

    @Post('publish/:id')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    publishProduct(
        @Param('id') productId: string,
        @AuthRequest('account') account: JWTdecode
    ) {
        return this.productService.publishProductByShop({
            productShopId: account.accountId,
            uuid: productId
        });
    }

    @Post('unpublish/:id')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    unpublishProduct(
        @Param('id') productId: string,
        @AuthRequest('account') account: JWTdecode
    ) {
        return this.productService.unPublishProductByShop({
            productShopId: account.accountId,
            uuid: productId
        });
    }

    @Get('drafts/all')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    getAllDraftForShop(
        @AuthRequest('account') account: JWTdecode,
        @Query('skip') skip?: string,
        @Query('take') take?: string
    ) {
        return this.productService.findAllDraftsForShop({
            productShopId: account.accountId,
            skip: skip ? parseInt(skip) : 0,
            take: take ? parseInt(take) : 10
        });
    }

    @Get('published/all')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    getAllPublishForShop(
        @AuthRequest('account') account: JWTdecode,
        @Query('skip') skip?: string,
        @Query('take') take?: string
    ) {
        return this.productService.findAllPublishForShop({
            productShopId: account.accountId,
            skip: skip ? parseInt(skip) : 0,
            take: take ? parseInt(take) : 10
        });
    }

    @Get('search/:keySearch')
    getListSearchProduct(@Param('keySearch') keySearch: string) {
        return this.productService.getListSearchProduct(keySearch);
    }

    @Get('all')
    findAllProducts(
        @Query('take') take?: string,
        @Query('skip') skip?: string,
        @Query('isPublished') isPublished?: string
    ) {
        const filter: any = {};
        if (isPublished !== undefined) {
            filter.isPublished = isPublished === 'true';
        }

        return this.productService.findAllProducts({
            take: take ? parseInt(take) : 50,
            skip: skip ? parseInt(skip) : 0,
            filter
        });
    }

    @Get(':productId')
    findProduct(@Param('productId') productId: string) {
        return this.productService.findUniqueProduct(productId);
    }
}
