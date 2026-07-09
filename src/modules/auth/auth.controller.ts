import { Controller, Get, Query, Redirect, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { AuthGuard } from "./auth.guard";
import { AuthUser } from "./auth.types";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("google")
  @Redirect()
  @ApiOperation({ summary: "Start Google OAuth2 login." })
  startGoogleLogin() {
    return { url: this.authService.buildGoogleAuthorizationUrl() };
  }

  @Get("google/callback")
  @Redirect()
  @ApiOperation({ summary: "Complete Google OAuth2 login and redirect to the frontend auth callback." })
  async googleCallback(@Query("code") code: string) {
    const session = await this.authService.loginWithGoogleCode(code);
    return { url: this.authService.buildFrontendCallbackUrl(session.accessToken) };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return the authenticated user represented by the bearer token." })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
