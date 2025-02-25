import {   
    Body,
    Controller,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";
import { ShopService } from "./shop.service";
import { RegisterShopDTO } from "./dto/register.dto";
import { LoginShopDTO } from "./dto/login.dto";
import { AuthRequestDTO } from "../auth/dto/auth-request.dto";
import { ApiKeyGuard } from "../auth/api-key.guard";
import { AuthGuard } from "../auth/auth-jwt.guard";
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
    @UseGuards(AuthGuard)
    logoutShop(@Req() req: AuthRequestDTO){
        return this.shopService.logout(req.keyStore)
    }

    @Post('handlerRefreshToken')
    @UseGuards(AuthGuard)
    handleRefreshToken(@Req() req: AuthRequestDTO){
        return this.shopService.handleRefreshToken(req.keyStore, req.account, req.refreshToken)
    }

}