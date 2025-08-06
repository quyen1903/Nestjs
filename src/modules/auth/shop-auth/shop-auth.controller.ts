import { ShopAuthService } from './shop-auth.service';
import { 
    Body, 
    Controller, 
    Post, 
    UseGuards, 
    Req, 
} from "@nestjs/common";
import { RegisterShopDTO } from "./dto/register.dto";
import { LoginShopDTO } from "./dto/login.dto";
import { JwtShop } from "./interface/jwt.shop";
import { ShopAuthGuard } from './auth-jwt.guard';
import { RoleGuard } from "../auth-role.guard";
import { Roles } from "../roles.decorator";
import { Role } from "src/shared/enums/role.enum";
import { ShopAuthRequest } from "./interface/shop.request";
import { ShopRequestDTO } from './dto/auth-request.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
@Controller('shop')
export class ShopAuthController {
    constructor(private readonly shopAuthService: ShopAuthService) {}

    @Post('register')
    registerShop(@Body() body: RegisterShopDTO){
        return this.shopAuthService.register(body)
    }

    @Post('login')
    loginShop(@Body() body: LoginShopDTO){
        return this.shopAuthService.login(body)
    }

    @Post('logout')
    @UseGuards(ShopAuthGuard, RoleGuard)
    @ApiBearerAuth()
    @Roles(Role.Shop)
    logoutShop(@Req() req: JwtShop){
        return this.shopAuthService.logout(req)
    }

    @Post('handlerRefreshToken')
    @UseGuards(ShopAuthGuard)
    handleRefreshToken(@Req() req: ShopRequestDTO){
        console.log("request", req)
        return this.shopAuthService.handleRefreshToken( req.shop.accountId, req.shop.refreshToken)
    }
}
