# Authentication

Authentication currently lives in the NestJS monolith, but it is intentionally isolated in `src/modules/auth` so it can later move to an API gateway or identity service.

## Current flow

- `GET /api/v1/auth/google` starts Google OAuth2 login.
- `GET /api/v1/auth/google/callback` exchanges the OAuth2 code and redirects to the frontend auth callback with an API bearer token in the URL fragment.
- `GET /api/v1/auth/me` returns the authenticated user.

The API bearer token is a JWT signed by this monolith with `HS256`, issuer and audience validation. `AUTH_JWT_SECRET` must be a high-entropy secret with at least 32 characters. Send it as:

```text
Authorization: Bearer <token>
```

## Required environment

```text
AUTH_JWT_SECRET=replace-with-a-long-random-secret
AUTH_JWT_ISSUER=quejugamos
AUTH_JWT_AUDIENCE=quejugamos-api
AUTH_JWT_EXPIRES_IN=2h

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
FRONTEND_AUTH_CALLBACK_URL=http://localhost:8081/auth/callback
```

## Google setup

Create an OAuth client in Google Cloud Console and add this authorized redirect URI:

```text
http://localhost:3000/api/v1/auth/google/callback
```

Production must use its own HTTPS callback URL.

The frontend callback URL is configured separately:

```text
FRONTEND_AUTH_CALLBACK_URL=https://app.example.com/auth/callback
```

The access token is placed in the URL fragment (`#access_token=...`) so it is consumed client-side by the frontend route and not sent back as a query string to intermediate servers.

## Gateway migration path

When authentication moves to an API gateway, set:

```text
AUTH_TRUSTED_GATEWAY_HEADERS=true
```

Then the API can trust these gateway-injected headers:

- `x-auth-user-id`
- `x-auth-user-email`
- `x-auth-user-name`
- `x-auth-user-role`

Only enable this behind a trusted gateway that strips incoming client-provided auth headers.

## Admin access

Admins are users with `role = admin`. Admin-only endpoints currently include:

- `GET /api/v1/users`
- `POST /api/v1/users`
- `POST /api/v1/games`
- `PATCH /api/v1/games/:slug`

User provisioning is admin-only and idempotent by email. Public self-service users are created through OAuth2 login, not by posting an email/password-less user directly.

Admins can modify game manual text, rules source URL, images, video tutorials through `assets`, materials, categories and logical attributes such as players, age, difficulty, indoor/outdoor and publication status.

Review queue endpoints require `reviewer` or `admin`:

- `GET /api/v1/games/moderation/pending`
- `PATCH /api/v1/games/:slug/moderation`
