import { Body, Controller, Post, Get, Query, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { RegisterUserDTO } from "./dto/register.dto";
import { LoginUserDTO } from "./dto/login.dto";
import { Authentication, AuthRequest } from "../auth/dto/auth-request.dto";
import { ApiKeyGuard } from "../auth/api-key.guard";
import { IKeyToken } from "src/shared/interfaces/keyToken.interface";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto";
import { ResetPasswordDTO } from "./dto/reset-password.dto";
import { UserAuthGuard } from "../auth/user-auth/auth-jwt.guard";
@Controller('user')
@UseGuards(ApiKeyGuard)
export class ShopController{
    constructor( private readonly userService: UserService ){}

    @Post('register')
    registerUser(@Body() body: RegisterUserDTO){
        return this.userService.registerManual(body)
    }

    @Post('login')
    loginUser(@Body() body: LoginUserDTO){
        return this.userService.loginManual(body)
    }

    @Post('logout')
    @UseGuards(UserAuthGuard)
    logoutUser(@AuthRequest('keyStore') req: IKeyToken){
        return this.userService.logout(req)
    }

    @Post('handlerRefreshToken')
    @UseGuards(UserAuthGuard)
    handleRefreshToken(@AuthRequest() req: Authentication){
        return this.userService.handleRefreshToken(req.keyStore, req.account, req.refreshToken)
    }

    @Post('forgot-password')
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDTO) {
      return this.userService.forgotPassword(forgotPasswordDto);
    }
  
    @Post('reset-password')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
      return this.userService.resetPasswordManual(resetPasswordDto);
    }
  
    @Get('validate-reset-token')
    async validateResetToken(@Query('token') token: string) {
      return this.userService.validatePasswordResetToken(token);
    }
}