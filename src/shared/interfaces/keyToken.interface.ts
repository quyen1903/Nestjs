export interface IKeyToken {
    accountId: string
    publicKey: string;
    refreshToken: string;
    roles: "SHOP" | "USER"
}