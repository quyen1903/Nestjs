import { Prisma, Shop,ShopKeyToken, APIkey } from "@prisma/client";

import { StrictBuilder } from "builder-pattern";

export class AuthSHopDTO{
    accountId: ShopKeyToken['sub']
    publicKey: ShopKeyToken['publicKey'];
    refreshToken: ShopKeyToken['refreshToken'];
    email: Shop['email'];

    static fromEntity(
        a: Prisma.ShopGetPayload<{
            include:{
                keyToken: true,
            };
        }>,

    ){
        return StrictBuilder<AuthSHopDTO>()
            .accountId(a.id)
            .email(a.email)
            .publicKey(a.keyToken.publicKey)
            .refreshToken(a.keyToken.refreshToken)
    }
}