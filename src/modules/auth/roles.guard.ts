import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import { AuthUser } from "./auth.types";
import { UserRole } from "../users/domain/user-role.enum";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!roles?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (request.user && roles.includes(request.user.role)) return true;
    throw new ForbiddenException("Insufficient role.");
  }
}
