interface JwtShop{
  sub: "shopId",
  role: "shop",
  permissions: ["product:create", "order:view"],
  iat: number,
  exp: number
}
