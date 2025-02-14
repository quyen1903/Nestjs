import { Shop } from "@prisma/client";

export type ShopRegister = Pick<Shop, 'name' | 'email' | 'password'>;