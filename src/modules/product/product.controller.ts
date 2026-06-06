import { Controller, Req, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { Roles } from '../auth/roles.decorator';
import { AccountType } from 'src/database/types';
import { CreateBrandDTO, CreateSkuDTO, CreateSpuDTO, CreateProductDTO } from './dto/request-product.dto';
import { ApiBearerAuth, ApiTags, PartialType } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';

// Add this DTO for update operations
export class UpdateProductDTO extends PartialType(CreateSpuDTO) {
    // Inherits all fields from CreateSpuDTO but makes them optional for updates
}

@Controller('product')
@ApiTags('Product')
@ApiBearerAuth('access')
export class ProductController {
    constructor(
        private readonly productService: ProductService
    ) {}

    @Post('create_product')
    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiEndpoint({
        summary: 'Create a new product with SPU and SKU',
        auth: true,
        body: { type: CreateProductDTO },
        responses: [{ status: 201, description: 'Product created successfully' }],
    })
    async createProduct(
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
    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiEndpoint({
        summary: 'Create a product brand',
        auth: true,
        body: { type: CreateBrandDTO },
        responses: [{ status: 201, description: 'Brand created successfully' }],
    })
    async createBrand(@Body() body: CreateBrandDTO) {
        return this.productService.createBrand(body);
    }

    // @Post('create_category')
    // @UseGuards(AccessTokenGuard, RoleGuard)
    // @Roles(AccountType.SHOP)
    // createCategory(@Body() createCategoryDto: CreateCategoryDTO) {
    //     return this.productService.createCategory(
    //         createCategoryDto.name, 
    //         createCategoryDto.parentId
    //     );
    // }


    @Patch(':productId')
    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiEndpoint({
        summary: 'Update a product',
        auth: true,
        params: [{ name: 'productId', required: true, example: 'spu_123' }],
        body: { type: UpdateProductDTO },
    })
    async updateProduct(
        @Param('productId') productId: string,
        @Body() updateProductDTO: Partial<CreateSpuDTO & CreateSkuDTO>,
        @AuthRequest('account') account: JWTdecode
    ) {
        return this.productService.updateProduct(productId, updateProductDTO);
    }

    @Post('publish/:id')
    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiEndpoint({
        summary: 'Publish a shop product',
        auth: true,
        params: [{ name: 'id', required: true, example: 'spu_123' }],
        responses: [{ status: 201, description: 'Product published' }],
    })
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
    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiEndpoint({
        summary: 'Unpublish a shop product',
        auth: true,
        params: [{ name: 'id', required: true, example: 'spu_123' }],
        responses: [{ status: 201, description: 'Product unpublished' }],
    })
    async unpublishProduct(
        @Param('id') productId: string,
        @AuthRequest('account') account: JWTdecode
    ) {
        return this.productService.unPublishProductByShop({
            shopBusinessId: account.accountId,
            uuid: productId
        });
    }

    @Get('drafts/all')
    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiEndpoint({
        summary: 'List draft products for authenticated shop',
        auth: true,
        queries: [
            { name: 'skip', required: false, example: 0, type: Number },
            { name: 'take', required: false, example: 10, type: Number },
        ],
    })
    async getAllDraftForShop(
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
    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiEndpoint({
        summary: 'List published products for authenticated shop',
        auth: true,
        queries: [
            { name: 'skip', required: false, example: 0, type: Number },
            { name: 'take', required: false, example: 10, type: Number },
        ],
    })
    async getAllPublishForShop(
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
    @ApiEndpoint({
        summary: 'Search products by keyword',
        params: [{ name: 'keySearch', required: true, example: 'iphone' }],
    })
    async getListSearchProduct(@Param('keySearch') keySearch: string) {
        return this.productService.getListSearchProduct(keySearch);
    }

    @Get('all')
    @ApiEndpoint({
        summary: 'List products',
        queries: [
            { name: 'take', required: false, example: 50, type: Number },
            { name: 'skip', required: false, example: 0, type: Number },
            { name: 'isPublished', required: false, example: true, type: Boolean },
        ],
    })
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
    @ApiEndpoint({
        summary: 'Get product details by id',
        params: [{ name: 'productId', required: true, example: 'spu_123' }],
    })
    async findProduct(@Param('productId') productId: string) {
        return this.productService.findUniqueProduct(productId);
    }

    @Get('productByName/:name')
    @ApiEndpoint({
        summary: 'Find products by name',
        params: [{ name: 'name', required: true, example: 'iphone' }],
    })
    async findProductByname(@Param('name') name: string) {
        return this.productService.findProductByname(name);
    }
}
