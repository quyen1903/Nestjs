export interface ShopKeyToken {
    sub: string
    publicKey: string;
    refreshToken: string;
    roles: "SHOP" | "USER"
}