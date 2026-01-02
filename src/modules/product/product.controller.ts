import { Controller, Req, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { Roles } from '../auth/roles.decorator';
import { AccountType } from 'prisma/generated/prisma';
import { CreateBrandDTO, CreateSkuDTO, CreateSpuDTO, CreateProductDTO, CreateCategoryDTO } from './dto/request-product.dto';
import { ApiResponse, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';

// Add this DTO for update operations
export class UpdateProductDTO extends CreateSpuDTO {
    // Inherits all fields from CreateSpuDTO but makes them optional for updates
}

@Controller('product')
@ApiBearerAuth('access')
export class ProductController {
    constructor(
        private readonly productService: ProductService
    ) {}

    @Post('create_product')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiOperation({ summary: 'Create a new product with SPU and SKU' })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    createProduct(
        @Body() createProductDto: CreateProductDTO,
        @AuthRequest('account') account: JWTdecode
    ) {
        console.log("product account",account)
        return this.productService.createProduct(
            createProductDto.spu, 
            createProductDto.sku, 
            account.accountId
        );
    }


    @Post('create_brand')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    createBrand(@Body() body: CreateBrandDTO) {
        return this.productService.createBrand(body);
    }

    @Post('create_category')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    createCategory(@Body() createCategoryDto: CreateCategoryDTO) {
        return this.productService.createCategory(
            createCategoryDto.name, 
            createCategoryDto.parentId
        );
    }


    @Patch(':productId')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    updateProduct(
        @Param('productId') productId: string,
        @Body() updateProductDTO: Partial<CreateSpuDTO & CreateSkuDTO>,
        @AuthRequest('account') account: JWTdecode
    ) {
        return this.productService.updateProduct(productId, updateProductDTO);
    }

    @Post('publish/:id')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    publishProduct(
        @Param('id') productId: string,
        @AuthRequest('account') account: JWTdecode
    ) {
        return this.productService.publishProductByShop({
            shopBusinessId: account.accountId,
            uuid: productId
        });
    }

    @Post('unpublish/:id')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    unpublishProduct(
        @Param('id') productId: string,
        @AuthRequest('account') account: JWTdecode
    ) {
        return this.productService.unPublishProductByShop({
            shopBusinessId: account.accountId,
            uuid: productId
        });
    }

    @Get('drafts/all')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    getAllDraftForShop(
        @AuthRequest('account') account: JWTdecode,
        @Query('skip') skip?: string,
        @Query('take') take?: string
    ) {
        return this.productService.findAllDraftsForShop({
            shopBusinessId: account.accountId,
            skip: skip ? parseInt(skip) : 0,
            take: take ? parseInt(take) : 10
        });
    }

    @Get('published/all')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    getAllPublishForShop(
        @AuthRequest('account') account: JWTdecode,
        @Query('skip') skip?: string,
        @Query('take') take?: string
    ) {
        return this.productService.findAllPublishForShop({
            shopBusinessId: account.accountId,
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

    @Get('productById/:productId')
    findProduct(@Param('productId') productId: string) {
        return this.productService.findUniqueProduct(productId);
    }

    @Get('productByName/:name')
    findProductByname(@Param('name') name: string) {
        return this.productService.findProductByname(name);
    }
}
