import { Iapikey } from 'src/shared/interfaces/apikey.interface';
import { KeyToken } from 'src/database/types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtShop } from './jwt.shop';

export interface ShopAuthRequest {
    keyStore: KeyToken;
    account: JwtShop;
    refreshToken: string;
    apiKey: Iapikey;
    requestId: string;
}

export const ShopAuthRequest = createParamDecorator(
    (data: keyof ShopAuthRequest | undefined, ctx: ExecutionContext) => {
            const request = ctx.switchToHttp().getRequest();
            const user = request.user ?? {};
            const authData: Partial<ShopAuthRequest> = {
            keyStore: request.keyStore ?? user.keyStore,
            account: request.account ?? user,
            refreshToken: request.refreshToken ?? user.refreshToken,
            apiKey: request.apiKey,
            requestId: request.requestId,
        };
        return data ? authData[data] : authData;
    },
);
