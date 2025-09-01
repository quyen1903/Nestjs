import { AccountAuthentication, KeyToken, Prisma } from "@prisma/client";

import { StrictBuilder } from "builder-pattern";

export class AuthSHopDTO{
    accountId: KeyToken['authId'];
    deviceId: KeyToken['deviceId'];
    publicKey: KeyToken['publicKey'];
    refreshToken: KeyToken['refreshToken'];
    static fromEntity(
        a: Prisma.KeyTokenGetPayload<{

        }>,

    ){
        return StrictBuilder<AuthSHopDTO>()
            .accountId(a.authId)
            .deviceId(a.authId)
            .publicKey(a.publicKey)
            .refreshToken(a.refreshToken)
    }
}