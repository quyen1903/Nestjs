import { Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateDiscountDTO } from './dto/createDiscount.dto';
import { GetListDiscountDTO } from './dto/getListDiscount.dto';
import { AmountDiscountDTO } from './dto/amountDiscount.dto';
import { getSelectData } from 'src/shared/utils';
import { Discount } from 'prisma/generated/prisma';
import { ProducerService } from 'src/services/kafka/services/producer.service';
@Injectable()
export class DiscountService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly producerService: ProducerService
    ){}
    
    private async checkDiscountExists(filter: {}): Promise<Discount | null>{
        return await this.prismaService.discount.findFirst({where:filter})
    }

    private async findAllDiscountCodesSelect (take: number, skip: number,filter: object,select: string[]): Promise<{}|null>{
        return await this.prismaService.discount.findMany({
            //sort by create decending
            where: filter,
            orderBy:{
                createdAt: 'asc'
            },
            select:getSelectData(select),
            take,
            skip,
        })
    };

    private async findAllProduct (id: string){
        return await this.prismaService.spu.findMany({
            where:{
                shopBusinessId: id,
                isMarketable: true
            },
            take: 50,
            skip:0
        })
    }

    async createDiscountCode( payload: CreateDiscountDTO, shopId: string ): Promise<Discount>{
        // Validate the date range for the discount code
        if (new Date() < new Date(payload.discountStartDates) || new Date() > new Date(payload.discountEndDates)) {
            throw new BadRequestException('Discount code has expired');
        }

        if (new Date(payload.discountStartDates) >= new Date(payload.discountEndDates)) {
            throw new BadRequestException('Start date must be before end date');
        }

        //check weather this discount used or not
        const foundDiscount = await this.checkDiscountExists({
            discountCode: payload.discountCode,
            discountShopId: shopId
        });

        if(foundDiscount && foundDiscount.discountIsActive){
            throw new BadRequestException('Discount existed!!!');
        }

        const newDiscount = await this.prismaService.discount.create({
            data:{
                ...payload,
                discountStartDates: new Date(payload.discountStartDates),
                discountEndDates: new Date(payload.discountEndDates),
                discountShopId: shopId
            }
        })

        if(newDiscount){
            const topics = this.producerService.getTopics()
            const shop = await this.prismaService.spu.findUnique({
                where:{
                    id: newDiscount.discountShopId
                }
            })
            await this.producerService.produce({
                topic: topics.DISCOUNT_CREATED,
                messages:[{
                    value: JSON.stringify({
                        discountId: newDiscount.id,
                        discountName: newDiscount.discountName,
                        discountValue: newDiscount.discountValue,
                        discountType: newDiscount.discountType,
                        shopId: newDiscount.discountShopId,
                        shopName: shop?.id
                    })
                }]
            })
        }

        return newDiscount
    }

    async getAllDiscountCodesWithProduct({ discountCode, discountShopId}: GetListDiscountDTO): Promise<{}>{
        //check weather discount used or existed
        const foundDiscount = await this.checkDiscountExists({
            discountCode,
            discountShopId,
        })

        if(!foundDiscount || !foundDiscount.discountIsActive){
            throw new NotFoundException('discount not existed!!')
        }

        const { discountAppliesTo, discountProductIds } = foundDiscount
        let products;

        //if discount apply for all product, we fillter by all product of specific shop
        if(discountAppliesTo === 'all') products  = this.findAllProduct(discountShopId);


        /*
            if discount apply for specific product we filter by all product
            which is in discount_product_ids[]
            $in operator selects the documents where the value of a field equals any value in the specified array
        */

        if(discountAppliesTo === 'specific') products = this.findAllProduct(discountShopId);
        return products;

    }

    
    async getAllDiscountCodesByShop( discountLimit: number, discountPage: number, discountShopId: string ): Promise<Discount[]>{
        const limit = Number(discountLimit) || 10;
        const page = Number(discountPage) || 1;
        return this.prismaService.discount.findMany({
            where:{
                discountShopId,
                discountIsActive:true
            },
            orderBy:{
                createdAt: 'asc'
            },
            take: limit,
            skip: (page - 1) * limit
        })
    }

    async getDiscountAmount({ discountCode, discountUserId, discountShopId, discountProducts }: AmountDiscountDTO){
        const foundDiscount = await this.checkDiscountExists({
            discountCode,
            discountShopId,
        })

        if(!foundDiscount) throw new NotFoundException('discount doesnt exist')
        if(!foundDiscount.discountIsActive) throw new NotFoundException('discount is expired!')
        if(!foundDiscount.discountMaxUses) throw new NotFoundException('discount are out!')

        if(new Date() < new Date(foundDiscount.discountStartDates) || new Date() > new Date(foundDiscount.discountEndDates)){
            throw new NotFoundException('discount code had expired!!')
        }

        //check wheather discount had minimum value
        let totalOrder = 0
        if(foundDiscount.discountMinOrderValue > 0){
            totalOrder = discountProducts.reduce((accumulator, product)=>{
                return accumulator + (product.quantity * product.price)
            },0)
            if(totalOrder < foundDiscount.discountMinOrderValue) {
                throw new NotFoundException(`discount require a minimum order of ${foundDiscount.discountMinOrderValue}`)
            }
        }

        //check wheather discount had maximum value
        if(foundDiscount.discountMaxUsesPerUser > 0){
            const userUserDiscount = foundDiscount.discountUsersUsed.find(element => element.toString() === discountUserId)
            if(userUserDiscount){
                throw new BadRequestException('this user already use this discount')
            }
        }

        //discount value can not surpass 100%
        if(foundDiscount.discountType === "percentage" && foundDiscount.discountValue > 100) {
            throw new BadRequestException('discount value can not surpass 100%')
        }

        //check wheather discount is fixed amount
        const amount = foundDiscount.discountType === 'fixed_amount' ? foundDiscount.discountValue : totalOrder * (foundDiscount.discountValue / 100)

        return {
            totalOrder,// discount percentage
            discount:amount,// reduced money
            totalPrice:totalOrder - amount//money user pay
        }
    }

    async deleteDiscountCode({discountShopId, discountCode}:AmountDiscountDTO){
        return this.prismaService.discount.delete({
            where: {
                discountCode,
                discountShopId
            }
        })
    }

}
