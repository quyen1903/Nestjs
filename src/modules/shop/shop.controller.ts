import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ShopService } from "./shop.service";
import { RegisterShopDTO } from "./dto/register.dto";
import { LoginShopDTO } from "./dto/login.dto";
import { Authentication, AuthRequest } from "../auth/dto/auth-request.dto";
import { ApiKeyGuard } from "../auth/api-key.guard";
import { AuthGuard } from "../auth/auth-jwt.guard";
import { RoleGuard } from "../auth/auth-role.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "src/shared/enums/role.enum";
import { IKeyToken } from "src/shared/interfaces/keyToken.interface";
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
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.Shop)
    logoutShop(@AuthRequest('keyStore') req: IKeyToken){
        return this.shopService.logout(req)
    }

    @Post('handlerRefreshToken')
    @UseGuards(AuthGuard)
    handleRefreshToken(@AuthRequest() req: Authentication){
        return this.shopService.handleRefreshToken(req.keyStore, req.account, req.refreshToken)
    }

}