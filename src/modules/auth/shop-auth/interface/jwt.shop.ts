import { RoleShop } from "src/database/types"
export interface JwtShop{
  sub: string,
  email: string,
  role: RoleShop,
  permissions: ["product:create", "order:view"],
  iat: number,
  exp: number
}
