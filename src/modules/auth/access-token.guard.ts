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

        console.log("decode: ",decoded)
        const keyStore = await this.keyTokenService.findByAccountId(decoded.accountId, decoded.deviceId);
        if (!keyStore) throw new UnauthorizedException('KeyStore not found');

        const account = this.jwtService.verify(token, { publicKey: keyStore.publicKey });
        request.account = account;
        request.keyStore = keyStore;
        console.log(request)
        return true;
    }
}
