import { Shop } from "@prisma/client";

export type RegisterShopDTO = Pick<Shop, 'name' | 'email' | 'password'>;