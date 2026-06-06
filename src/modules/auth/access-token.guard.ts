import { 
    CanActivate, 
    ExecutionContext, 
    Injectable, 
    UnauthorizedException, 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { KeyTokenService } from 'src/modules/keytoken/keytoken.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly keyTokenService: KeyTokenService
    ) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const token = request.headers['authorization']?.split(' ')[1];

        if (!token) throw new UnauthorizedException('Missing access token');
        const decoded = this.jwtService.decode(token) as any;
        if (!decoded?.accountId || !decoded?.deviceId) {
            throw new UnauthorizedException('Invalid token payload');
        }

        const keyStore = await this.keyTokenService.findByAccountId(decoded.accountId, decoded.deviceId);
        if (!keyStore) throw new UnauthorizedException('KeyStore not found');

        const account = this.jwtService.verify(token, { publicKey: keyStore.publicKey, algorithms: ['RS256'] });
        if (account.tokenType !== 'access') {
            throw new UnauthorizedException('Invalid access token type');
        }

        request.account = account;
        request.user = { ...account, keyStore };
        request.accountId = account.accountId;
        request.deviceId = account.deviceId;
        request.keyStore = keyStore;
        return true;
    }
}
