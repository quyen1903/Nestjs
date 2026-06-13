import { Request } from "express";

import { AuthSHopDTO } from "./auth-shop.dto";

export type ShopRequestDTO = Request & { shop: AuthSHopDTO }