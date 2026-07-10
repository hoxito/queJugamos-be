# API Endpoints

Base URL:

```text
http://localhost:3000/api/v1
```

All error responses use RFC 9457 Problem Details with `Content-Type: application/problem+json`.

```json
{
  "type": "about:blank",
  "title": "BAD REQUEST",
  "status": 400,
  "detail": "Request validation failed.",
  "instance": "/api/v1/games",
  "errors": ["title should not be empty"]
}
```

Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

## Health

### `GET /health`

Use this endpoint for service health checks.

Response:

```json
{
  "status": "ok",
  "service": "quejugamos-api",
  "timestamp": "2026-07-10T12:00:00.000Z"
}
```

## Authentication

### `GET /auth/google`

Starts Google OAuth2 login.

Response: redirects to Google OAuth.

### `GET /auth/google/callback?code=<oauth-code>`

Completes Google OAuth2 login and redirects to the frontend auth callback with the JWT in the URL fragment.

Response: redirects to `FRONTEND_AUTH_CALLBACK_URL#access_token=<jwt>`.

### `GET /auth/me`

Returns the authenticated user represented by the bearer token.

Response:

```json
{
  "id": "99999999-9999-9999-9999-999999999999",
  "email": "admin@quejugamos.local",
  "displayName": "Admin QueJugamos",
  "role": "admin"
}
```

## Games

### `GET /games`

Lists approved games. Use query parameters for simple catalog filtering.

Example:

```http
GET /api/v1/games?materialSlugs=paper&materialSlugs=pen&page=1&limit=30
```

`materialIds` and `materialSlugs` are arrays. In GET requests they can be sent as repeated params or comma-separated values:

```http
GET /api/v1/games?materialSlugs=paper,pen
GET /api/v1/games?materialSlugs=paper&materialSlugs=pen
```

Response:

```json
{
  "items": [
    {
      "slug": "tateti",
      "title": "Tateti",
      "summaryMd": "Players alternate marking X or O on a 3 by 3 grid.",
      "ratingAverage": 3.8,
      "ratingCount": 20,
      "coverImage": null,
      "categories": [{ "slug": "abstract", "name": "Abstract" }],
      "materials": [{ "slug": "paper", "name": "Paper", "kind": "paper", "requirementType": "required", "quantity": 1 }],
      "ratings": [{ "value": 4, "comment": "Very good game for the right group." }],
      "minPlayers": 2,
      "maxPlayers": 2,
      "minAge": 5,
      "difficulty": "easy",
      "durationMinutes": 5
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 30,
  "hasNextPage": false
}
```

### `POST /games/query`

Preferred endpoint for complex catalog search. The backend filters and ranks the full catalog before pagination.

Request:

```json
{
  "query": "quick",
  "materialSlugs": ["paper", "pen"],
  "players": 2,
  "maxAge": 8,
  "difficulty": "easy",
  "outdoorOnly": false,
  "page": 1,
  "limit": 30
}
```

Response: same shape as `GET /games`.

### `GET /games/filters`

Returns available filters for catalog UI.

Response:

```json
{
  "categories": [{ "slug": "abstract", "name": "Abstract" }],
  "materials": [{ "slug": "paper", "name": "Paper", "kind": "paper", "requirementType": "required", "quantity": null, "notes": null }],
  "difficulties": ["easy", "medium", "hard"],
  "minPlayers": 1,
  "maxPlayers": 12,
  "minAge": 5,
  "maxAge": 18
}
```

### `GET /games/:slug`

Returns game details.

Response:

```json
{
  "slug": "tateti",
  "title": "Tateti",
  "summaryMd": "Players alternate marking X or O on a 3 by 3 grid.",
  "rulesMd": "## Objective\nPlayers alternate marking X or O...",
  "galleryImages": [],
  "downloadableAssets": [],
  "referenceLinks": [],
  "coverImage": null,
  "materials": [{ "slug": "paper", "name": "Paper", "kind": "paper", "requirementType": "required", "quantity": 1 }],
  "categories": [{ "slug": "abstract", "name": "Abstract" }],
  "ratings": [{ "value": 4, "comment": "Very good game for the right group." }],
  "minPlayers": 2,
  "maxPlayers": 2,
  "minAge": 5,
  "difficulty": "easy",
  "durationMinutes": 5,
  "ratingAverage": 3.8,
  "ratingCount": 20
}
```

### `POST /games`

Creates a game. Admin only.

Request:

```json
{
  "title": "Tateti",
  "summaryMd": "A fast alignment game on a 3 by 3 grid.",
  "rulesMd": "Players alternate marking X or O. The first to complete a row wins.",
  "minPlayers": 2,
  "maxPlayers": 2,
  "minAge": 5,
  "difficulty": "easy",
  "durationMinutes": 5,
  "indoor": true,
  "outdoor": true,
  "materials": [
    {
      "materialId": "11111111-1111-1111-1111-111111111111",
      "requirementType": "required",
      "quantity": 1,
      "notes": "Use one sheet."
    }
  ],
  "categoryIds": ["22222222-2222-2222-2222-222222222222"]
}
```

Response: game detail.

### `PATCH /games/:slug`

Updates a game. Admin only.

Request: partial `CreateGameDto` fields.

Response: updated game detail.

### `GET /games/moderation/pending`

Lists pending games for moderation. Requires `reviewer` or `admin`.

Response: same paginated catalog shape as `GET /games`.

### `PATCH /games/:slug/moderation`

Approves or rejects a game. Requires `reviewer` or `admin`.

Request:

```json
{
  "status": "approved",
  "note": "Approved after checking materials and rules."
}
```

Response: game detail.

## Materials

### `GET /materials`

Lists materials.

Response:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Paper",
    "slug": "paper",
    "kind": "paper",
    "aliases": ["sheet"]
  }
]
```

### `POST /materials`

Idempotently creates or updates a material by slug. Admin only.

Request:

```json
{
  "name": "Paper",
  "slug": "paper",
  "kind": "paper",
  "aliases": ["sheet"]
}
```

Response: material.

## Categories

### `GET /categories`

Lists categories.

Response:

```json
[
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "name": "Quick Play",
    "slug": "quick-play"
  }
]
```

### `POST /categories`

Idempotently creates or updates a category by slug. Admin only.

Request:

```json
{
  "name": "Quick Play",
  "slug": "quick-play"
}
```

Response: category.

## Users

### `GET /users`

Lists users. Admin only.

Response:

```json
[
  {
    "id": "99999999-9999-9999-9999-999999999999",
    "email": "admin@quejugamos.local",
    "displayName": "Admin QueJugamos",
    "role": "admin"
  }
]
```

### `POST /users`

Idempotently provisions or updates an OAuth-backed user by email. Admin only. Public users should be created through OAuth login.

Request:

```json
{
  "email": "player@example.com",
  "displayName": "Player One",
  "role": "player"
}
```

Response: user.

## Ratings

### `POST /games/:slug/ratings`

Creates or updates a game rating.

Request:

```json
{
  "userId": "99999999-9999-9999-9999-999999999999",
  "value": 5,
  "comment": "Great table presence."
}
```

Response: game rating.

## Comments

### `GET /games/:slug/comments`

Lists comments for a game.

Response:

```json
[
  {
    "id": "33333333-3333-3333-3333-333333333333",
    "bodyMd": "Fun with kids.",
    "user": {
      "displayName": "Player One"
    }
  }
]
```

### `POST /games/:slug/comments`

Creates a comment for a game.

Request:

```json
{
  "userId": "99999999-9999-9999-9999-999999999999",
  "bodyMd": "Fun with kids.",
  "parentId": null
}
```

Response: comment.
