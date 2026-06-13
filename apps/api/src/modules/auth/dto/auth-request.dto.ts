import { Iapikey } from 'src/shared/interfaces/apikey.interface';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { KeyToken } from 'prisma/generated/prisma';
import jwt from 'jsonwebtoken';

export type AuthAccountPayload = {
  accountId: string;
  deviceId: string;
  email: string;
  role: string;
  permissions?: string[];
};

export type AuthenticatedRequest = Request & {
  account: AuthAccountPayload;
  accountId: string;
  deviceId: string;
  keyStore: KeyToken;
  refreshToken?: string;
  apiKey?: Iapikey;
  requestId?: string;
};

export interface Authentication {
  keyStore: KeyToken;
  account: AuthAccountPayload;
  refreshToken?: string;
  apiKey?: Iapikey;
  requestId?: string;
}


export const AuthRequest = createParamDecorator(
  (data: keyof Authentication | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    const authData: Authentication = {
      keyStore: request.keyStore,
      account: request.account,
      refreshToken: request.refreshToken,
      apiKey: request.apiKey,
      requestId: request.requestId,
    };

    return data ? authData[data] : authData;
  },
);

