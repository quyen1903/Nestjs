import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth.service';
import { Sex, UserProfile, UserSocialProvider } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        super({
            clientID: configService.get<string>('google.clientID'),
            clientSecret: configService.get<string>('google.clientSecret'),
            callbackURL: configService.get<string>('google.callbackURL'),
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id: providerId, name, emails, photos } = profile;

        const social = {
            email: emails[0].value,
            provider: UserSocialProvider.GOOGLE,
            providerId,
            userId: '', // placeholder, will be used in service
            isActive: true,
            createdAt: BigInt(Date.now()),
            updatedAt: BigInt(Date.now()),
        };

        const userProfile: UserProfile = {
            userId: '', // placeholder, will be used in service
            name: name?.givenName + ' ' + name?.familyName,
            phone: '', // not available from Google by default
            sex: Sex.FEMALE,
            avatar: photos?.[0]?.value ?? '',
            dateOfBirth: new Date(0),
            isActive: true,
            createdAt: BigInt(Date.now()),
            updatedAt: BigInt(Date.now()),
        };

        const result = await this.authService.findOrCreateGoogleUser(social, userProfile);
        done(null, result);
    }
}
