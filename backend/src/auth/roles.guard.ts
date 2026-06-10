import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      Reflect.getMetadata(ROLES_KEY, context.getHandler()) ||
      Reflect.getMetadata(ROLES_KEY, context.getClass());

    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (user && requiredRoles.includes(user.role)) return true;

    throw new ForbiddenException('Admin role is required for this resource.');
  }
}
