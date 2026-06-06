import { 
    CanActivate, 
    ExecutionContext, 
    Injectable, 
    UnauthorizedException, 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { KeyTokenService } from 'src/modules/keytoken/keytoken.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly keyTokenService: KeyTokenService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const rawRefreshToken = request.headers['x-rtoken-id'];
    const refreshToken = Array.isArray(rawRefreshToken) ? rawRefreshToken[0] : rawRefreshToken;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    const decoded = this.jwtService.decode(refreshToken) as any;
    if (!decoded?.accountId || !decoded?.deviceId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const keyStore = await this.keyTokenService.findByAccountId(decoded.accountId, decoded.deviceId);
    if (!keyStore) throw new UnauthorizedException('KeyStore not found');

    const user = this.jwtService.verify(refreshToken, { publicKey: keyStore.publicKey, algorithms: ['RS256'] });
    if (user.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    request.user = user;
    request.account = user;
    request.accountId = user.accountId;
    request.deviceId = user.deviceId;
    request.keyStore = keyStore;
    request.refreshToken = refreshToken;
    return true;
  }
}
