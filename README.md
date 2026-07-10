# queJugamos-be

NestJS backend for the QueJugamos catalog.

This repository is independent from the frontend to avoid nested or overlapping Git repositories.

## Run locally

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm start:dev
```

The API listens on:

```text
http://localhost:3000/api/v1
```

API documentation:

```text
Swagger UI: http://localhost:3000/api/v1/docs
OpenAPI JSON: http://localhost:3000/api/v1/docs-json
```

## Docker

```bash
docker compose up --build
```

The Postgres service stores data in the named volume `postgres_data`. The API container runs `prisma migrate deploy` and the idempotent Prisma seed before starting, so existing data is preserved between restarts.

Services:

- API: `localhost:3000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

## Search endpoint

Use `POST /api/v1/games/query` for complex searches by materials, players, age and difficulty.

`QUERY` is documented in `docs/HTTP_QUERY.md`; it is not the primary endpoint because NestJS/adapters/proxies do not support it consistently yet.
Search behavior is documented in `docs/SEARCH.md`. Material filters are applied by the backend against the full catalog, ranked by matching required materials, and only then paginated. Frontend and mobile clients must not filter materials locally over an already paginated page.

Catalog responses are paginated and intentionally lightweight:

```text
GET /api/v1/games?page=1&limit=30
POST /api/v1/games/query
```

They return `items`, `total`, `page`, `limit` and `hasNextPage`. Each item includes public fields only: title, slug, summary, rating numbers, cover image, categories, materials and basic metadata.
Catalog items also include public `ratings` so the frontend can show rating distributions or previews without fetching each detail page.

Available filters for the catalog:

```text
GET /api/v1/games/filters
```

It returns categories, materials, difficulties and available player/age ranges for filter UI.

Game details use:

```text
GET /api/v1/games/:slug
```

The detail response includes structured rules, gallery images, downloadable assets, external reference links and public ratings.

Moderator/admin review queue:

```text
GET /api/v1/games/moderation/pending
PATCH /api/v1/games/:slug/moderation
```

Both require bearer auth with `reviewer` or `admin` role. Moderation currently accepts `approved` or `rejected`.

Google OAuth starts at:

```text
GET /api/v1/auth/google
```

After Google returns to `GOOGLE_OAUTH_CALLBACK_URL`, the backend redirects to `FRONTEND_AUTH_CALLBACK_URL` with the bearer token in the URL fragment. The frontend consumes that fragment and then calls `GET /api/v1/auth/me` to load the authenticated user and role.

Catalog, catalog query, filter and detail responses are cached through a Redis-backed Nest interceptor. Cache limits are configurable with:

```text
GAMES_QUERY_CACHE_TTL_SECONDS
GAMES_QUERY_CACHE_MAX_ENTRIES
GAMES_DETAIL_CACHE_TTL_SECONDS
GAMES_DETAIL_CACHE_MAX_ENTRIES
GAMES_FILTERS_CACHE_TTL_SECONDS
GAMES_FILTERS_CACHE_MAX_ENTRIES
```

## Documentation

- [Data model](docs/DATA_MODEL.md)
- [ERD](docs/ERD.md)
- [Prisma migrations](docs/MIGRATIONS.md)
- [API endpoints](docs/API_ENDPOINTS.md)
- [HTTP QUERY](docs/HTTP_QUERY.md)
- [Search behavior](docs/SEARCH.md)
- [API collections](docs/API_COLLECTIONS.md)
- [RFC 9457 errors](docs/ERRORS.md)
- [OAuth2 authentication](docs/AUTH.md)

Generate committed Swagger/OpenAPI and Postman collection files with:

```bash
pnpm api:docs:generate
```

Before opening or updating a backend PR, run the automated post-feature trigger when possible:

```bash
pnpm post-feature
```

## Curated game import

The curated dataset lives in `database/curated-games.json`.

Fast import without external image enrichment:

```bash
pnpm import:curated
```

Image enrichment through BoardGameGeek:

```bash
pnpm import:curated:bgg
```

BGG mode is intentionally slow because the XML API asks clients to avoid frequent requests. Imported images are stored as `game_assets` with `source_type = manual_url`, source URL and attribution. A later job can download and upload those assets to S3/R2 and switch the same rows to `object_storage`.
