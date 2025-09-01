import { Iapikey } from 'src/shared/interfaces/apikey.interface';
import { KeyToken } from '@prisma/client';
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
            const authData: Partial<ShopAuthRequest> = {
            keyStore: request.keyStore,
            account: request.account,
            refreshToken: request.refreshToken,
            apiKey: request.apiKey,
            requestId: request.requestId,
        };
        return data ? authData[data] : authData;
    },
);
