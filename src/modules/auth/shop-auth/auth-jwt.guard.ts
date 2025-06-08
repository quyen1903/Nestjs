import { 
    CanActivate, 
    ExecutionContext, 
    Injectable, 
    UnauthorizedException, 
    BadRequestException, 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ShopKeyTokenService } from './shop-auth.keytoken';

@Injectable()
export class ShopAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly shopKeyTokenService: ShopKeyTokenService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const accountId = request.headers['x-client-id'] as string;

        if (!accountId) throw new UnauthorizedException('Invalid Request, missing client ID');

        // Find KeyStore
        const keyStore = await this.shopKeyTokenService.findByAccountId(accountId);
        if (!keyStore) throw new UnauthorizedException('KeyStore not found');


        // Check Refresh Token
        const refreshToken = request.headers['x-rtoken-id'] as string;
        if (refreshToken) {
            const decodedUser = this.jwtService.verify(refreshToken, {publicKey:keyStore.publicKey});
            if (accountId !== decodedUser['sub']) throw new UnauthorizedException('Invalid User ID');
            console.log("this is refreshtoken", refreshToken)
            request['account'] = decodedUser;
            request['keyStore'] = keyStore;
            request['refreshToken'] = refreshToken;
            return true;
        }

        // Check Access Token
        const accessToken = request.headers['authorization'] as string;
        if (!accessToken) throw new UnauthorizedException('Invalid Request');

        try {
            const decodedUser = this.jwtService.verify(accessToken, {publicKey:keyStore.publicKey});
            console.log("decoded>>>>>>>>>>>>>>>>",decodedUser)
            if (accountId !== decodedUser['sub']) throw new UnauthorizedException('Invalid User ID');
            request['account'] = decodedUser;
            request['keyStore'] = keyStore;
            request['refreshToken'] = accessToken;
        } catch (error) {
            console.error('AuthGuard Error:', error);
            throw new BadRequestException('wrong access or refresh token, please relogin');
        }

        return true;
    }
}
