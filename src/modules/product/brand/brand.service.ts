import { Injectable } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BadRequestException } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
@Injectable()
export class BrandService {

    constructor(
        private readonly drizzleService: DrizzleService
    ) {}

    async create(createBrandDto: CreateBrandDto) {
        try {
            return await this.drizzleService.brand.create({
                data:{...createBrandDto}
            })
        } catch (error) {
            throw new BadRequestException('Failed to create brand');
        }
    }

}
