import { 
    CanActivate, 
    ExecutionContext, 
    Injectable, 
    UnauthorizedException, 
    BadRequestException, 
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
    const refreshToken = request.headers['x-rtoken-id'] as string;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    const decoded = this.jwtService.decode(refreshToken) as any;
    const keyStore = await this.keyTokenService.findByAccountId(decoded.accountId, decoded.deviceId);
    if (!keyStore) throw new UnauthorizedException('KeyStore not found');

    const user = this.jwtService.verify(refreshToken, { publicKey: keyStore.publicKey });
    request.user = user;
    request.keyStore = keyStore;
    request.refreshToken = refreshToken;
    return true;
  }
}
