import { Controller, Req, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { CategoryService } from "./category.service";
import { Roles } from 'src/modules/auth/roles.decorator';
import { RoleGuard } from 'src/modules/auth/auth-role.guard';
import { AccessTokenGuard } from 'src/modules/auth/access-token.guard';
import { AccountType } from 'prisma/generated/prisma';
import { CreateCategoryDTO } from './dto/category.dto';
@Controller('category')
export class CategoryController {
    constructor(
        private readonly categoryService: CategoryService
    ) {}
    @Post('create_category')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    createCategory(@Body() createCategoryDto: CreateCategoryDTO) {
        return this.categoryService.createCategory(
            createCategoryDto.name, 
            createCategoryDto.parentId
        );
    }
}