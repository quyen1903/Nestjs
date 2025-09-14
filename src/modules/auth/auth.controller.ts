import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import 'express';
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * #1st route
     * this method triggered when we click sign-in with google\
     * after user successfully login, we redirect to second route
     */
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
        // This route initiates the Google OAuth flow
    }

    /**
     * #2nd route
     * after user successfully login, googel redirect to this route
     * this time authguard handle response from google
     * @param req 
     * @param res 
     * @returns 
     */
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        const { accessToken, refreshToken } = (req as any).user;

        console.log("req", req)
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.sendFile('auth-success.html', { root: 'public' });
    }
} 
