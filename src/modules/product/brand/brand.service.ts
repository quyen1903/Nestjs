import { Injectable } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
@Injectable()
export class BrandService {

    constructor(
        private readonly prismaService: PrismaService
    ) {
        this.prismaService = prismaService;
    }

    async create(createBrandDto: CreateBrandDto) {
        try {
            return await this.prismaService.brand.create({
                data:{...createBrandDto}
            })
        } catch (error) {
            throw new BadRequestException('Failed to create brand');
        }
    }

}
