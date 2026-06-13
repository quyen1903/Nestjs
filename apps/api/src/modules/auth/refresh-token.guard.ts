import { 
    CanActivate, 
    ExecutionContext, 
    Injectable, 
    UnauthorizedException, 
    BadRequestException, 
    ForbiddenException,
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
    if (!decoded?.accountId || !decoded?.deviceId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const duplicateJWT = await this.keyTokenService.findByUsedRefreshToken(refreshToken);
    if (duplicateJWT) {
      await this.keyTokenService.removeKeyByAccountID(decoded.accountId);
      throw new ForbiddenException('Token reuse detected, please login again');
    }

    const keyStore = await this.keyTokenService.findByAccountId(decoded.accountId, decoded.deviceId);
    if (!keyStore) throw new UnauthorizedException('KeyStore not found');

    let user: any;
    try {
      user = this.jwtService.verify(refreshToken, {
        publicKey: keyStore.publicKey,
        algorithms: ['RS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // request.user = user;
    // request.keyStore = keyStore;
    // request.refreshToken = refreshToken;
    request.account = user;
    request.accountId = user.accountId;
    request.deviceId = user.deviceId;
    request.keyStore = keyStore;
    request.refreshToken = refreshToken;
    return true;
  }
}
