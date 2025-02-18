import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { KeyTokenService } from '../keytoken/keytoken.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly keyTokenService: KeyTokenService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const accountId = request.headers['x-client-id'] as string;

        if (!accountId) throw new UnauthorizedException('Invalid Request, missing client ID');

        // Find KeyStore
        const keyStore = await this.keyTokenService.findByAccountId(accountId);
        if (!keyStore) throw new UnauthorizedException('KeyStore not found');

        request['keyStore'] = keyStore;

        // Check Refresh Token
        const refreshToken = request.headers['x-rtoken-id'] as string;
        if (refreshToken) {
            const decodedUser = this.jwtService.verifyToken(refreshToken, keyStore.publicKey);
            if (accountId !== decodedUser['accountId']) throw new UnauthorizedException('Invalid User ID');

            request['account'] = decodedUser;
            request['refreshToken'] = refreshToken;
            return true;
        }

        // Check Access Token
        const accessToken = request.headers['authorization'] as string;
        if (!accessToken) throw new UnauthorizedException('Invalid Request');

        const decodedUser = this.jwtService.verifyToken(accessToken, keyStore.publicKey);
        if (accountId !== decodedUser['accountId']) throw new UnauthorizedException('Invalid User ID');

        request['account'] = decodedUser;
        return true;
    }
}
