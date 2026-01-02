import { SetMetadata } from "@nestjs/common";
import { AccountType } from "prisma/generated/prisma";
export const ROLES_KEY = 'roles';
export const Roles = (...roles: AccountType[]) => SetMetadata(ROLES_KEY, roles) 