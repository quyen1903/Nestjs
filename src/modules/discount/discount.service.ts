import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateDiscountDTO } from './dto/createDiscount.dto';

@Injectable()
export class DiscountService {
    constructor(private readonly prismaService: PrismaService){}
    async createDiscountCode( payload: CreateDiscountDTO, shopId: string ){
        // Validate the date range for the discount code
        if (new Date() < new Date(payload.discountStartDate) || new Date() > new Date(payload.discountEndDate)) {
            throw new BadRequestException('Discount code has expired');
        }

        if (new Date(payload.discountStartDate) >= new Date(payload.discountEndDate)) {
            throw new BadRequestException('Start date must be before end date');
        }

        //check weather this discount used or not
        const foundDiscount = await this.prismaService.discount.findFirst({
            where:{
                discountCode: payload.discountCode,
                discountShopId: shopId
            }
        })

        if(foundDiscount && foundDiscount.discountIsActive){
            throw new BadRequestException('Discount existed!!!');
        }

        const newDiscount = await this.prismaService.discount.create({
            data:{
                ...payload,
                discountStartDates: new Date(payload.discountStartDate),
                discountEndDates: new Date(payload.discountEndDate),
                discountShopId: shopId
            }
        })

        return newDiscount
    }
}
