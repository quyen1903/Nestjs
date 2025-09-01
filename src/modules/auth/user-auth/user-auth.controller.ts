import { UserAuthService } from './user-auth.service';
import { Body, Controller, Post, Get, Query, UseGuards, Req } from "@nestjs/common";
import { RegisterUserDTO } from "./dto/register.dto";
import { LoginUserManualDTO } from "./dto/login.dto";
import { Authentication, AuthRequest } from "../dto/auth-request.dto";
import { IKeyToken } from "src/shared/interfaces/keyToken.interface";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto";
import { ResetPasswordDTO } from "./dto/reset-password.dto";
import { JWTGuard } from '../auth-jwt.guard';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@Controller('user-auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

    @Post('loginManual')
    loginUser(@Body() body: LoginUserManualDTO){
        return this.userAuthService.loginManual(body)
    }
    
    @ApiBearerAuth()
    @Post('logout')
    @UseGuards(JWTGuard)
    logoutUser(@Req() req: IKeyToken){
        return this.userAuthService.logout(req)
    }

    @Post('handlerRefreshToken')
    @UseGuards(JWTGuard)
    handleRefreshToken(@Req() req: any){
        return this.userAuthService.handleRefreshToken(req.authId, req.deviceId, req.refreshToken)
    }

    @Post('forgot-password')
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDTO) {
        return this.userAuthService.forgotPassword(forgotPasswordDto);
    }
    
    @Post('reset-password')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
        return this.userAuthService.resetPasswordManual(resetPasswordDto);
    }
    
    @Get('validate-reset-token')
    async validateResetToken(@Query('token') token: string) {
        return this.userAuthService.validatePasswordResetToken(token);
    }
}
