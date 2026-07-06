# queJugamos-be

Backend NestJS para el catalogo de QueJugamos.

Este repo es independiente del frontend para evitar repositorios Git anidados o superpuestos.

## Run locally

```bash
pnpm install
pnpm start:dev
```

The API listens on:

```text
http://localhost:3000/api/v1
```

Swagger:

```text
http://localhost:3000/api/v1/docs
```

## Docker

```bash
docker compose up --build
```

Services:

- API: `localhost:3000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

## Search endpoint

Use `POST /api/v1/games/query` for complex searches by materials, players, age and difficulty.

`QUERY` is documented in `docs/HTTP_QUERY.md`; it is not the primary endpoint because NestJS/adapters/proxies do not support it consistently yet.

## Documentation

- [Modelo de datos](docs/DATA_MODEL.md)
- [ERD](docs/ERD.md)
- [HTTP QUERY](docs/HTTP_QUERY.md)

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
