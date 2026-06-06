import { ShopAuthService } from './shop-auth.service';
import { 
    Body, 
    Controller, 
    Post, 
    UseGuards, 
    Req, 
} from "@nestjs/common";
import { LoginManualDTO } from '../dto/loginManual.dto';
import { JwtAccessAuthGuard } from '../guards/jwt-access-auth.guard';
import { JwtRefreshAuthGuard } from '../guards/jwt-refresh-auth.guard';
import { RoleGuard } from "../auth-role.guard";
import { Roles } from "../roles.decorator";
import { AccountType } from 'src/database/types';
import { ApiTags } from '@nestjs/swagger';
import { RegisterShopDTO } from './dto/register.dto';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';

@Controller()
@ApiTags('Shop Auth')
export class ShopAuthController {
    constructor(private readonly shopAuthService: ShopAuthService) {}

    @Post('login')
    @ApiEndpoint({
        summary: 'Login shop with email and password',
        body: { type: LoginManualDTO },
        responses: [{ status: 201, description: 'Shop login tokens returned' }],
    })
    loginShop(@Body() body: LoginManualDTO){
        return this.shopAuthService.login(body)
    }

    @Post('logout')
    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Roles(AccountType.SHOP)
    @ApiEndpoint({
        summary: 'Logout authenticated shop',
        auth: true,
        responses: [{ status: 201, description: 'Shop logged out' }],
    })
    logoutShop(@Req() req: any){
        const auth = req.user ?? req;
        return this.shopAuthService.logout(auth.keyStore ?? req.keyStore ?? auth)
    }

    @Post('handlerRefreshToken')
    @UseGuards(JwtRefreshAuthGuard)
    @ApiEndpoint({
        summary: 'Refresh shop token pair',
        auth: true,
        responses: [{ status: 201, description: 'New token pair returned' }],
    })
    handleRefreshToken(@Req() req: any){
        const auth = req.user ?? req;
        return this.shopAuthService.handleRefreshToken(auth.accountId, auth.deviceId, auth.refreshToken)
    }

    @Post('register')
    @ApiEndpoint({
        summary: 'Register a shop account',
        body: { type: RegisterShopDTO },
        responses: [{ status: 201, description: 'Shop registered' }],
    })
    registerShop(@Body() body: RegisterShopDTO){
        return this.shopAuthService.register(body)
    }
}
