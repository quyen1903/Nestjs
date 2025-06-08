import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // @Get('google')
    // @UseGuards(AuthGuard('google'))
    // async googleAuth() {
    //     // This route initiates the Google OAuth flow
    // }

    // @Get('google/callback')
    // @UseGuards(AuthGuard('google'))
    // async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    //     const result = await this.authService.findOrCreateGoogleUser(req.user);
        
    //     // Set cookies or handle the response as needed
    //     res.cookie('access_token', result.tokens.accessToken, {
    //         httpOnly: true,
    //         secure: process.env.NODE_ENV === 'production',
    //         sameSite: 'strict',
    //         maxAge: 24 * 60 * 60 * 1000 // 24 hours
    //     });

    //     res.cookie('refresh_token', result.tokens.refreshToken, {
    //         httpOnly: true,
    //         secure: process.env.NODE_ENV === 'production',
    //         sameSite: 'strict',
    //         maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    //     });

    //     // Redirect to frontend with success
    //     res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
    // }
} 