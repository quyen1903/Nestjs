import { RoleShop } from "prisma/generated/prisma"
export interface JwtShop{
  sub: string,
  email: string,
  role: RoleShop,
  permissions: ["product:create", "order:view"],
  iat: number,
  exp: number
}
