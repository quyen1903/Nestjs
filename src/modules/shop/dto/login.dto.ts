import { Shop } from "@prisma/client";

export type LoginShopDTO = Pick<Shop, 'email' | 'password'>;