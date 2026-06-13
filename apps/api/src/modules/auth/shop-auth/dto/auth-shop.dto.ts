import { AccountAuthentication, KeyToken, Prisma } from "prisma/generated/prisma";
import { StrictBuilder } from "builder-pattern";

export class AuthSHopDTO{
    accountId: KeyToken['authId'];
    deviceId: KeyToken['deviceId'];
    publicKey: KeyToken['publicKey'];
    refreshToken: KeyToken['refreshToken'];
    static fromEntity(
        a: Prisma.KeyTokenGetPayload<{}>,
    ){
        return StrictBuilder<AuthSHopDTO>()
            .accountId(a.authId)
            .deviceId(a.deviceId)
            .publicKey(a.publicKey)
            .refreshToken(a.refreshToken)
            .build()    
    }
}