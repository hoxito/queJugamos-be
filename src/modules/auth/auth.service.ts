import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "../users/domain/user-role.enum";
import { AuthUser, JwtUserPayload } from "./auth.types";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenInfo = {
  aud: string;
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  buildGoogleAuthorizationUrl() {
    const clientId = this.required("GOOGLE_OAUTH_CLIENT_ID");
    const redirectUri = this.googleRedirectUri();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account"
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async loginWithGoogleCode(code: string) {
    if (!code) throw new BadRequestException("Missing OAuth code.");
    const tokenResponse = await this.exchangeGoogleCode(code);
    if (!tokenResponse.id_token) {
      throw new UnauthorizedException(tokenResponse.error_description ?? tokenResponse.error ?? "Google login failed.");
    }

    const profile = await this.verifyGoogleIdToken(tokenResponse.id_token);
    const user = await this.upsertOAuthUser("google", profile.sub, profile.email, profile.name ?? profile.email);
    return {
      accessToken: this.signAccessToken(user),
      tokenType: "Bearer",
      user
    };
  }

  async verifyAccessToken(token: string): Promise<AuthUser> {
    try {
      const payload = jwt.verify(token, this.jwtSecret(), {
        issuer: this.config.get<string>("AUTH_JWT_ISSUER", "quejugamos"),
        audience: this.config.get<string>("AUTH_JWT_AUDIENCE", "quejugamos-api")
      }) as JwtUserPayload;

      return {
        id: payload.sub,
        email: payload.email,
        displayName: payload.name,
        role: payload.role
      };
    } catch {
      throw new UnauthorizedException("Invalid bearer token.");
    }
  }

  private async exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.required("GOOGLE_OAUTH_CLIENT_ID"),
        client_secret: this.required("GOOGLE_OAUTH_CLIENT_SECRET"),
        redirect_uri: this.googleRedirectUri(),
        grant_type: "authorization_code"
      })
    });

    return response.json() as Promise<GoogleTokenResponse>;
  }

  private async verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) throw new UnauthorizedException("Google token verification failed.");
    const profile = (await response.json()) as GoogleTokenInfo;
    if (profile.aud !== this.required("GOOGLE_OAUTH_CLIENT_ID")) {
      throw new UnauthorizedException("Google token audience mismatch.");
    }
    if (profile.email_verified !== true && profile.email_verified !== "true") {
      throw new UnauthorizedException("Google account email is not verified.");
    }
    return profile;
  }

  private async upsertOAuthUser(provider: string, providerAccountId: string, email: string, displayName: string) {
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true }
    });

    if (existingAccount) {
      await this.prisma.oAuthAccount.update({
        where: { id: existingAccount.id },
        data: { email, displayName }
      });
      return this.toAuthUser(existingAccount.user);
    }

    const user = await this.prisma.user.upsert({
      where: { email },
      update: { displayName },
      create: { email, displayName, role: UserRole.Player }
    });

    await this.prisma.oAuthAccount.create({
      data: { provider, providerAccountId, email, displayName, userId: user.id }
    });

    return this.toAuthUser(user);
  }

  private signAccessToken(user: AuthUser) {
    return jwt.sign(
      {
        email: user.email,
        name: user.displayName,
        role: user.role
      },
      this.jwtSecret(),
      {
        subject: user.id,
        issuer: this.config.get<string>("AUTH_JWT_ISSUER", "quejugamos"),
        audience: this.config.get<string>("AUTH_JWT_AUDIENCE", "quejugamos-api"),
        expiresIn: this.config.get<SignOptions["expiresIn"]>("AUTH_JWT_EXPIRES_IN", "2h")
      }
    );
  }

  private toAuthUser(user: { id: string; email: string; displayName: string; role: string }): AuthUser {
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role as UserRole };
  }

  private googleRedirectUri() {
    return this.config.get<string>("GOOGLE_OAUTH_CALLBACK_URL", "http://localhost:3000/api/v1/auth/google/callback");
  }

  buildFrontendCallbackUrl(accessToken: string) {
    const baseUrl = this.config.get<string>("FRONTEND_AUTH_CALLBACK_URL", "http://localhost:8081/auth/callback");
    const separator = baseUrl.includes("#") ? "&" : "#";
    return `${baseUrl}${separator}access_token=${encodeURIComponent(accessToken)}`;
  }

  private jwtSecret() {
    return this.required("AUTH_JWT_SECRET");
  }

  private required(name: string) {
    const value = this.config.get<string>(name);
    if (!value) throw new BadRequestException(`Missing required configuration: ${name}.`);
    return value;
  }
}
