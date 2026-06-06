import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptionsWithRequest } from 'passport-jwt';
import { JwtService } from '@nestjs/jwt';
import { KeyTokenService } from 'src/modules/keytoken/keytoken.service';
import { Request } from 'express';
import type { KeyToken } from 'src/database/types';

type JwtPayload = {
  accountId: string;
  deviceId: string;
  email?: string;
  role?: string;
  tokenType?: string;
};

type AuthenticatedRequest = Request & {
  account?: JwtPayload & { keyStore: KeyToken };
  accountId?: string;
  deviceId?: string;
  keyStore?: KeyToken;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly keyTokenService: KeyTokenService,
  ) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKeyProvider: async (req, rawJwtToken, done) => {
        try {
          const decoded = jwtService.decode(rawJwtToken) as { accountId?: string; deviceId?: string } | null;
          if (!decoded?.accountId || !decoded?.deviceId) {
            return done(new UnauthorizedException('Invalid token payload'), null);
          }

          const keyStore = await keyTokenService.findByAccountId(decoded.accountId, decoded.deviceId);
          if (!keyStore) {
            return done(new UnauthorizedException('KeyStore not found'), null);
          }

          return done(null, keyStore.publicKey);
        } catch (error) {
          return done(error as Error, null);
        }
      },
    };

    super(options);
  }

  async validate(req: Request, payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    const { accountId, deviceId } = payload;

    if (!accountId || !deviceId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Fetch the public key from KeyStore
    const keyStore = await this.keyTokenService.findByAccountId(accountId, deviceId);
    if (!keyStore) {
      throw new UnauthorizedException('KeyStore not found');
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const verified = this.jwtService.verify(token, {
        publicKey: keyStore.publicKey,
        algorithms: ['RS256'],
      }) as JwtPayload;

      if (verified.tokenType !== 'access') {
        throw new UnauthorizedException('Invalid access token type');
      }

      const authContext = { ...verified, keyStore };
      const request = req as AuthenticatedRequest;
      request.account = authContext;
      request.accountId = verified.accountId;
      request.deviceId = verified.deviceId;
      request.keyStore = keyStore;

      return authContext;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token signature');
    }
  }
}
