import { Iapikey } from 'src/shared/interfaces/apikey.interface';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserKeyToken } from '@prisma/client';
import jwt from 'jsonwebtoken';

export type AuthJWTPayloadDTO = jwt.JwtPayload
export interface Authentication {
  keyStore: UserKeyToken;
  account: JwtUser;
  refreshToken: string;
  apiKey: Iapikey;
  requestId: string;
}

export const AuthRequest = createParamDecorator(
    (data: keyof jwt.JwtPayload | undefined, ctx: ExecutionContext) => {
            const request = ctx.switchToHttp().getRequest();
            const authData: Partial<jwt.JwtPayload> = {
            keyStore: request.keyStore,
            account: request.account,
            refreshToken: request.refreshToken,
            apiKey: request.apiKey,
            requestId: request.requestId,
        };

        return data ? authData[data] : authData;
    },
);

