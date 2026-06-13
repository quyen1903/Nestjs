import { SetMetadata } from "@nestjs/common";

export const PERMISSION_KEY = 'permission'
export const RequirePermission = (permission: '0000' | '1111' | '2222') => 
    SetMetadata(PERMISSION_KEY, permission);     