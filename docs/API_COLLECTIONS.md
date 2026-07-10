# API collections

The versioned API collections live in this folder:

- `docs/api/openapi.json`: OpenAPI document generated from the NestJS Swagger configuration.
- `docs/api/postman_collection.json`: Postman v2.1 collection generated from the same OpenAPI document.

Generate both files after adding or changing controllers, DTOs, Swagger decorators or route metadata:

```bash
pnpm api:docs:generate
```

This command builds the NestJS app, creates `openapi.json` through `@nestjs/swagger`, then converts that OpenAPI document to Postman v2.1 with `openapi-to-postmanv2`. DTO metadata is the source of truth for request bodies, query params and examples, so array fields must be described as arrays in DTO decorators.

Check whether the committed files are up to date:

```bash
pnpm api:docs:check
```

Postman collection generation uses `openapi-to-postmanv2`, maintained by PostmanLabs, instead of custom conversion code.

For normal feature work, use the repository trigger:

```bash
pnpm post-feature
```

It regenerates Swagger/Postman, runs typecheck and tests, then verifies that committed API docs are current.

Git hooks are configured through Husky in `.husky/`. The `pre-push` hook runs `pnpm api:docs:check`, which is preferable to `pre-commit` because API documentation generation builds the NestJS app and can be slower than normal commit-time checks.

If hooks were not installed automatically during `pnpm install`, run:

```bash
pnpm hooks:install
```
