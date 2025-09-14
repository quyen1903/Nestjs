import { ShopAuthService } from './shop-auth.service';
import { 
    Body, 
    Controller, 
    Post, 
    UseGuards, 
    Req, 
} from "@nestjs/common";
import { LoginShopDTO } from "./dto/login.dto";
import { JWTGuard } from '../auth-jwt.guard';
import { RoleGuard } from "../auth-role.guard";
import { Roles } from "../roles.decorator";
import { Role } from "src/shared/enums/role.enum";
import { ApiBearerAuth } from '@nestjs/swagger';
@Controller('shop-auth')
export class ShopAuthController {
    constructor(private readonly shopAuthService: ShopAuthService) {}

    @Post('login')
    loginShop(@Body() body: LoginShopDTO){
        console.log("body",body)
        return this.shopAuthService.login(body)
    }

    @Post('logout')
    @UseGuards(JWTGuard, RoleGuard)
    @ApiBearerAuth()
    @Roles(Role.Shop)
    logoutShop(@Req() req: any){
        return this.shopAuthService.logout(req)
    }

    @Post('handlerRefreshToken')
    @UseGuards(JWTGuard)
    handleRefreshToken(@Req() req: any){
        console.log("request", req)
        return this.shopAuthService.handleRefreshToken( req.accountId, req.deviceId, req.refreshToken)
    }
}
