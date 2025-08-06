import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserAuthService } from '../user-auth.service';
import { Sex, UserProfile, UserSocialProvider } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        readonly configService: ConfigService,
        private readonly userAuthService: UserAuthService,
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
    }

    async validate(accessToken, refreshToken, profile, done) {
    const { id: providerId, name, emails, photos } = profile;

    const social = {
        email: emails[0].value,
        provider: UserSocialProvider.GOOGLE,
        providerId,
        userId: '',
        isActive: true,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
    };

    const userProfile: UserProfile = {
        userId: '',
        name: name?.givenName + ' ' + name?.familyName,
        phone: '',
        sex: Sex.FEMALE,
        avatar: photos?.[0]?.value ?? '',
        dateOfBirth: new Date(0),
        isActive: true,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
    };

    const result = await this.userAuthService.findOrCreateGoogleUser(social, userProfile);

    // ✅ Return to bind into req.user
    return done(null, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
    });
    }

}
