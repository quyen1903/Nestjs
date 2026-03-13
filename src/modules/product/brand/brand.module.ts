import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Module({
  imports:[],
  controllers: [BrandController],
  providers: [BrandService, PrismaService],
})
export class BrandModule {}
