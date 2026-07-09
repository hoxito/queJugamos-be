import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthUser } from "./auth.types";
import { UserRole } from "../users/domain/user-role.enum";

type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const gatewayUser = this.readGatewayUser(request);
    if (gatewayUser) {
      request.user = gatewayUser;
      return true;
    }

    const authorization = this.header(request, "authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
    if (!token) throw new UnauthorizedException("Missing bearer token.");

    request.user = await this.authService.verifyAccessToken(token);
    return true;
  }

  private readGatewayUser(request: AuthenticatedRequest): AuthUser | undefined {
    if (this.config.get<string>("AUTH_TRUSTED_GATEWAY_HEADERS", "false") !== "true") return undefined;
    const id = this.header(request, "x-auth-user-id");
    const email = this.header(request, "x-auth-user-email");
    const role = this.header(request, "x-auth-user-role") as UserRole | undefined;
    if (!id || !email || !role) return undefined;
    const displayName = this.header(request, "x-auth-user-name") ?? email;
    return { id, email, displayName, role };
  }

  private header(request: AuthenticatedRequest, name: string) {
    const value = request.headers[name];
    return Array.isArray(value) ? value[0] : value;
  }
}
