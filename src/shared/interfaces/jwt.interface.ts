export interface JWTdecode{
    accountId: string
    deviceId: string,
    email: string,
    role: string,
    tokenType: 'access' | 'refresh',
    permissions:string[],
    iat: number,
    exp: number
}
