import { Body, Controller, Post, UseGuards, Get, Param } from "@nestjs/common";
import { ShopService } from "./shop.service";
import { RegisterShopDTO } from "./dto/register.dto";
import { LoginShopDTO } from "./dto/login.dto";
import { JwtShop } from "../auth/shop-auth/interface/jwt.shop";
import { ApiKeyGuard } from "../auth/api-key.guard";
import { ShopAuthGuard } from '../auth/shop-auth/auth-jwt.guard';
import { RoleGuard } from "../auth/auth-role.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "src/shared/enums/role.enum";
import { ShopAuthRequest } from "../auth/shop-auth/interface/shop.request";
@Controller('shop')
@UseGuards(ApiKeyGuard)
export class ShopController{
    constructor( private readonly shopService: ShopService ){}

    @Post('register')
    registerShop(@Body() body: RegisterShopDTO){
        return this.shopService.register(body)
    }

    @Post('login')
    loginShop(@Body() body: LoginShopDTO){
        return this.shopService.login(body)
    }

    @Post('logout')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @Roles(Role.Shop)
    logoutShop(@ShopAuthRequest('keyStore') req: JwtShop){
        return this.shopService.logout(req)
    }

    @Post('handlerRefreshToken')
    @UseGuards(ShopAuthGuard)
    handleRefreshToken(@ShopAuthRequest() req: ShopAuthRequest){
        console.log("request", req)
        return this.shopService.handleRefreshToken(req.keyStore, req.account, req.refreshToken)
    }

    @Get(':id')
    getShopInfo(@Param('id') id: string){
        return this.shopService.getShopInfo(id)
    }
}