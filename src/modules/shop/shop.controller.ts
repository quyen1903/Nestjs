import { Body, Controller, Post, UseGuards, Get, Param } from "@nestjs/common";
import { ShopService } from "./shop.service";
import { RegisterShopDTO } from "./dto/register.dto";

@Controller('shop')
// @UseGuards(ApiKeyGuard)
export class ShopController{
    constructor( private readonly shopService: ShopService ){}

    @Post('register')
    registerShop(@Body() body: RegisterShopDTO){
        return this.shopService.register(body)
    }

}