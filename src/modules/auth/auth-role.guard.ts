import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Role } from 'src/shared/enums/role.enum';
import { ROLES_KEY } from "./roles.decorator";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

@Injectable()
export class RoleGuard implements CanActivate{
    constructor(
        private reflector: Reflector
    ){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // Nếu không đặt role, ai cũng có quyền
        }

        const request = context.switchToHttp().getRequest();
        const user = request['account'];

        if (!user || !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}