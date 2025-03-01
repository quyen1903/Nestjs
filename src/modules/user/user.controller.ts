import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { RegisterUserDTO } from "./dto/register.dto";
import { LoginUserDTO } from "./dto/login.dto";
import { Authentication, AuthRequest } from "../auth/dto/auth-request.dto";
import { ApiKeyGuard } from "../auth/api-key.guard";
import { AuthGuard } from "../auth/auth-jwt.guard";
import { IKeyToken } from "src/shared/interfaces/keyToken.interface";
@Controller('user')
@UseGuards(ApiKeyGuard)
export class ShopController{
    constructor( private readonly userService: UserService ){}

    @Post('register')
    registerUser(@Body() body: RegisterUserDTO){
        return this.userService.register(body)
    }

    @Post('login')
    loginUser(@Body() body: LoginUserDTO){
        return this.userService.login(body)
    }

    @Post('logout')
    @UseGuards(AuthGuard)
    logoutUser(@AuthRequest('keyStore') req: IKeyToken){
        return this.userService.logout(req)
    }

    @Post('handlerRefreshToken')
    @UseGuards(AuthGuard)
    handleRefreshToken(@AuthRequest() req: Authentication){
        return this.userService.handleRefreshToken(req.keyStore, req.account, req.refreshToken)
    }

}