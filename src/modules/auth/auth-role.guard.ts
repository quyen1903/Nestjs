import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Role } from 'src/shared/enums/role.enum';
import { ROLES_KEY } from "./roles.decorator";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

@Injectable()
export class RoleGuard implements CanActivate{
    constructor(
        private reflector: Reflector//get metadata that you try to attach by decorator (e.g @SetMetadata('roles', ['admin']))
    ){}

    /**
     * ROLES_KEY is constant we defined in decorator @Roles()
     * @param context current execution context
     * @returns boolean
     */
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),//Returns the *type* of the controller class which the current handler belongs to
            context.getClass(),//Returns a reference to the handler (method) that will be invoked next in the request pipeline

        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // if we not set role for handler, anyone can access
        }

        const request = context.switchToHttp().getRequest();// take request in HTTP context
        const user = request['account'];

        if (!user || !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}