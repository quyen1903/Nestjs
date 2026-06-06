import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { DrizzleService } from 'src/database/drizzle.service';

@Module({
  imports:[],
  controllers: [BrandController],
  providers: [BrandService, DrizzleService],
})
export class BrandModule {}
