import { Iapikey } from 'src/shared/interfaces/apikey.interface';
import { IKeyToken } from 'src/shared/interfaces/keyToken.interface';
import { IJWTdecode } from 'src/shared/interfaces/jwt.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface Authentication {
  keyStore: IKeyToken;
  account: IJWTdecode;
  refreshToken: string;
  apiKey: Iapikey;
  requestId: string;
}

export const AuthRequest = createParamDecorator(
    (data: keyof Authentication | undefined, ctx: ExecutionContext) => {
            const request = ctx.switchToHttp().getRequest();
            const authData: Partial<Authentication> = {
            keyStore: request.keyStore,
            account: request.account,
            refreshToken: request.refreshToken,
            apiKey: request.apiKey,
            requestId: request.requestId,
        };

        return data ? authData[data] : authData;
    },
);
