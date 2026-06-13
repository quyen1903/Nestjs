export interface JWTdecode{
    accountId: string
    deviceId: string,
    email: string,
    role: string,
    permissions:string[],
    iat: number,
    exp: number
}