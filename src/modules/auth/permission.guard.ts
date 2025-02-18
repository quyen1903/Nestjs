import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly requiredPermission: '0000' | '1111' | '2222') {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request['apiKey'];

    if (!apiKey?.permission || !apiKey.permission.includes(this.requiredPermission)) {
      throw new ForbiddenException('Permission denied');
    }

    return true;
  }
}
