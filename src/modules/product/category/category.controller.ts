import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';

@Controller('category')
@ApiTags('Category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiEndpoint({
    summary: 'Create a category',
    body: { type: CreateCategoryDto },
    responses: [{ status: 201, description: 'Category created' }],
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiEndpoint({ summary: 'List categories' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiEndpoint({
    summary: 'Get category by id',
    params: [{ name: 'id', required: true, example: 1, type: Number }],
  })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Patch(':id')
  @ApiEndpoint({
    summary: 'Update category by id',
    params: [{ name: 'id', required: true, example: 1, type: Number }],
    body: { type: UpdateCategoryDto },
  })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiEndpoint({
    summary: 'Delete category by id',
    params: [{ name: 'id', required: true, example: 1, type: Number }],
  })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
