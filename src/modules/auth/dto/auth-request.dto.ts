import { Iapikey } from 'src/shared/interfaces/apikey.interface';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { KeyToken } from 'src/database/types';
import jwt from 'jsonwebtoken';

export type AuthJWTPayloadDTO = jwt.JwtPayload
export interface Authentication {
  keyStore: KeyToken;
  account: JwtUser;
  refreshToken: string;
  apiKey: Iapikey;
  requestId: string;
}


export const AuthRequest = createParamDecorator(
  (data: keyof Authentication | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user ?? {};

    const authData: Authentication = {
      keyStore: request.keyStore ?? user.keyStore,
      account: request.account ?? user,
      refreshToken: request.refreshToken ?? user.refreshToken,
      apiKey: request.apiKey,
      requestId: request.requestId,
    };

    return data ? authData[data] : authData;
  },
);


