import { Controller, UseGuards,Post, Body } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDTO } from './dto/createDiscount.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { IJWTdecode } from 'src/shared/interfaces/jwt.interface';
import { AuthGuard } from '../auth/auth-jwt.guard';

@UseGuards(ApiKeyGuard)
@Controller('discount')
export class DiscountController {
    constructor(private readonly discountService: DiscountService) {}

    @Post('')
    @UseGuards(AuthGuard)
    createDiscountCode(@Body() payload:CreateDiscountDTO, @AuthRequest('account') account:IJWTdecode){
        console.log("accountId",account.accountId)
        return this.discountService.createDiscountCode(payload, account.accountId)
    }

}
