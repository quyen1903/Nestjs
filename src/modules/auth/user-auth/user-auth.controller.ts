import { UserAuthService } from './user-auth.service';
import { Body, Controller, Post, Get, Query, UseGuards, Req } from "@nestjs/common";
import { LoginUserManualDTO } from "./dto/login.dto";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto";
import { ResetPasswordDTO } from "./dto/reset-password.dto";
import { ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../guards/jwt-access-auth.guard';
import { JwtRefreshAuthGuard } from '../guards/jwt-refresh-auth.guard';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';
@Controller()
@ApiTags('User Auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

    @Post('loginManual')
    @ApiEndpoint({
        summary: 'Login user with email and password',
        body: { type: LoginUserManualDTO },
        responses: [{ status: 201, description: 'User login tokens returned' }],
    })
    loginUser(@Body() body: LoginUserManualDTO){
        return this.userAuthService.loginManual(body)
    }
    
    @Post('logout')
    @UseGuards(JwtAccessAuthGuard)
    @ApiEndpoint({
        summary: 'Logout authenticated user',
        auth: true,
        responses: [{ status: 201, description: 'User logged out' }],
    })
    logoutUser(@Req() req: any){
        return this.userAuthService.logout(req.user ?? req)
    }

    @Post('handlerRefreshToken')
    @UseGuards(JwtRefreshAuthGuard)
    @ApiEndpoint({
        summary: 'Refresh user token pair',
        auth: true,
        responses: [{ status: 201, description: 'New token pair returned' }],
    })
    handleRefreshToken(@Req() req: any){
        const auth = req.user ?? req;
        return this.userAuthService.handleRefreshToken(auth.accountId, auth.deviceId, auth.refreshToken)
    }

    @Post('forgot-password')
    @ApiEndpoint({
        summary: 'Request password reset email',
        body: { type: ForgotPasswordDTO },
        responses: [{ status: 201, description: 'Password reset email queued if account exists' }],
    })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDTO) {
        return this.userAuthService.forgotPassword(forgotPasswordDto);
    }
    
    @Post('reset-password')
    @ApiEndpoint({
        summary: 'Reset user password',
        body: { type: ResetPasswordDTO },
        responses: [{ status: 201, description: 'Password reset completed' }],
    })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
        return this.userAuthService.resetPasswordManual(resetPasswordDto);
    }
    
    @Get('validate-reset-token')
    @ApiEndpoint({
        summary: 'Validate a password reset token',
        queries: [{ name: 'token', required: true, example: 'reset-token' }],
    })
    async validateResetToken(@Query('token') token: string) {
        return this.userAuthService.validatePasswordResetToken(token);
    }
}
