import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brand')
@ApiExcludeController()
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

}
