import { RoleShop } from "@prisma/client"
export interface JwtShop{
  sub: string,
  username: string,
  role: RoleShop,
  permissions: ["product:create", "order:view"],
  iat: number,
  exp: number
}
