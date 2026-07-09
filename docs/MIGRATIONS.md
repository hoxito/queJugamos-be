# Manual de migraciones Prisma

Este backend usa Prisma como fuente de verdad del modelo de datos. Las tablas, relaciones e indices viven en `prisma/schema.prisma` y las migraciones versionadas en `prisma/migrations`.

## Desarrollo local

1. Levantar Postgres y Redis:

```bash
docker compose up postgres redis
```

2. Crear una migracion cuando cambie el modelo:

```bash
pnpm prisma:migrate --name nombre_del_cambio
```

3. Regenerar el cliente y validar:

```bash
pnpm prisma:generate
pnpm typecheck
pnpm test
```

4. Poblar datos base idempotentes:

```bash
pnpm prisma:seed
```

El seed se puede ejecutar mas de una vez. Usa `upsert`, por lo que no duplica materiales, usuario admin ni juegos base.

## Ambientes compartidos

En staging/produccion no se usa `migrate dev`. El despliegue debe ejecutar:

```bash
pnpm prisma:deploy
pnpm prisma:seed
pnpm start:prod
```

El contenedor Docker ya ejecuta esos pasos antes de iniciar NestJS. Prisma aplica solo migraciones pendientes y registra el estado en `_prisma_migrations`.

## Datos persistentes en Docker

`docker-compose.yml` define el volumen `postgres_data` montado en `/var/lib/postgresql/data`. Mientras ese volumen exista, la data queda persistida y no hace falta recrearla con cada arranque.

Para reiniciar contenedores sin borrar datos:

```bash
docker compose down
docker compose up --build
```

Para borrar toda la base local de forma intencional:

```bash
docker compose down -v
```

## Reparacion de bases locales TypeORM

Si una base local fue creada con TypeORM antes de migrar a Prisma, puede tener tablas correctas pero enums con nombres TypeORM como `games_status_enum`. Prisma espera enums como `"GameStatus"` y puede fallar con:

```text
type "public.GameStatus" does not exist
```

Para reparar esa base local sin borrar datos, ejecutar `database/repair-typeorm-prisma-enums.sql` y luego marcar la migracion inicial como aplicada:

```bash
docker cp database/repair-typeorm-prisma-enums.sql quejugamos-postgres:/tmp/repair-typeorm-prisma-enums.sql
docker compose exec postgres psql -v ON_ERROR_STOP=1 -U quejugamos -d quejugamos -f /tmp/repair-typeorm-prisma-enums.sql
DATABASE_URL=postgresql://quejugamos:quejugamos@localhost:5432/quejugamos pnpm prisma migrate resolve --applied 20260708000000_init
```

## Reglas para cambios de schema

- Todo cambio de tablas, columnas, enums, indices o relaciones debe pasar por `prisma/schema.prisma`.
- Toda migracion debe quedar versionada en `prisma/migrations`.
- Si el cambio requiere datos iniciales o backfill reproducible, actualizar `prisma/seed.cjs` o agregar SQL explicito en la migracion.
- No editar migraciones ya aplicadas en ambientes compartidos; crear una migracion nueva.
- Revisar manualmente las migraciones que cambien datos, borren columnas o alteren enums.
- Mantener `.env.example`, README y Swagger alineados cuando cambien contratos o variables.
