import { ShopAuthService } from './shop-auth.service';
import { 
    Body, 
    Controller, 
    Post, 
    UseGuards, 
    Req, 
} from "@nestjs/common";
import { LoginManualDTO } from '../dto/loginManual.dto';
import { AccessTokenGuard } from '../access-token.guard';
import { RefreshTokenGuard } from '../refresh-token.guard';
import { RoleGuard } from "../auth-role.guard";
import { Roles } from "../roles.decorator";
import { AccountType } from 'prisma/generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RegisterShopDTO } from './dto/register.dto';

@Controller()
export class ShopAuthController {
    constructor(private readonly shopAuthService: ShopAuthService) {}

    @Post('login')
    loginShop(@Body() body: LoginManualDTO){
        console.log("body",body)
        return this.shopAuthService.login(body)
    }

    @Post('logout')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @ApiBearerAuth()
    @Roles(AccountType.SHOP)
    logoutShop(@Req() req: any){
        return this.shopAuthService.logout(req)
    }

    @Post('handlerRefreshToken')
    @UseGuards(RefreshTokenGuard)
    handleRefreshToken(@Req() req: any){
        console.log("request", req)
        return this.shopAuthService.handleRefreshToken( req.accountId, req.deviceId, req.refreshToken)
    }

    @Post('register')
    registerShop(@Body() body: RegisterShopDTO){
        return this.shopAuthService.register(body)
    }
}
