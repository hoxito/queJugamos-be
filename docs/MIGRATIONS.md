# Prisma Migration Guide

This backend uses Prisma as the source of truth for the data model. Tables, relations, and indexes live in `prisma/schema.prisma`; versioned migrations live in `prisma/migrations`.

## Local Development

1. Start Postgres and Redis:

```bash
docker compose up postgres redis
```

2. Create a migration after changing the model:

```bash
pnpm prisma:migrate --name change_name
```

3. Regenerate the client and validate:

```bash
pnpm prisma:generate
pnpm typecheck
pnpm test
```

4. Seed idempotent base data:

```bash
pnpm prisma:seed
```

The seed can run more than once. It uses `upsert`, so it does not duplicate materials, the admin user, or base games.

## Shared Environments

Staging and production must not use `migrate dev`. Deployment should run:

```bash
pnpm prisma:deploy
pnpm prisma:seed
pnpm start:prod
```

The Docker container already runs these steps before starting NestJS. Prisma applies only pending migrations and records state in `_prisma_migrations`.

## Persistent Docker Data

`docker-compose.yml` defines the `postgres_data` volume mounted at `/var/lib/postgresql/data`. As long as this volume exists, data remains persistent and does not need to be recreated on every startup.

Restart containers without deleting data:

```bash
docker compose down
docker compose up --build
```

Intentionally delete the whole local database:

```bash
docker compose down -v
```

## Repairing Local TypeORM Databases

If a local database was created with TypeORM before the Prisma migration, it may have correct tables but TypeORM-style enum names such as `games_status_enum`. Prisma expects enum names such as `"GameStatus"` and may fail with:

```text
type "public.GameStatus" does not exist
```

To repair that local database without deleting data, run `database/repair-typeorm-prisma-enums.sql` and then mark the initial migration as applied:

```bash
docker cp database/repair-typeorm-prisma-enums.sql quejugamos-postgres:/tmp/repair-typeorm-prisma-enums.sql
docker compose exec postgres psql -v ON_ERROR_STOP=1 -U quejugamos -d quejugamos -f /tmp/repair-typeorm-prisma-enums.sql
DATABASE_URL=postgresql://quejugamos:quejugamos@localhost:5432/quejugamos pnpm prisma migrate resolve --applied 20260708000000_init
```

## Schema Change Rules

- Every table, column, enum, index, or relation change must go through `prisma/schema.prisma`.
- Every migration must be versioned in `prisma/migrations`.
- If a change needs initial data or reproducible backfill, update `prisma/seed.cjs` or add explicit SQL in the migration.
- Do not edit migrations that have already been applied in shared environments; create a new migration instead.
- Manually review migrations that change data, drop columns, or alter enums.
- Keep `.env.example`, README, and Swagger aligned when contracts or environment variables change.
