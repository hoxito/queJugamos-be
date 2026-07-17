# AGENTS.md

Mandatory guide for any agent or developer working in this repository.

## Repository Goal

This backend must stay a simple, modular, testable NestJS API that is easy to evolve. Every change should favor low coupling, explicit contracts, useful documentation, and compatibility with the official NestJS documentation.

Base references:

- NestJS documentation: https://docs.nestjs.com/
- NestJS OpenAPI/Swagger: https://docs.nestjs.com/openapi/introduction
- NestJS testing: https://docs.nestjs.com/fundamentals/testing
- NestJS Prisma recipe: https://docs.nestjs.com/recipes/prisma

## Architecture Principles

- Follow official NestJS patterns: `module`, `controller`, `service`, injectable providers, pipes, guards, interceptors, and filters when appropriate.
- Organize by domain/module, not by global technical type. For example, `src/modules/games` owns the games controller, service, DTOs, domain models, and tests.
- Every domain with its own HTTP contract should have a dedicated module. Current examples include `games`, `materials`, `categories`, `users`, `ratings`, `comments`, `auth`, `prisma`, and `redis`.
- A module should contain its controllers, services, DTOs, domain types, mappers/presenters, and related tests. Do not place one domain's logic inside another module for convenience.
- Modules communicate through providers exported by the owning module. If `ratings` needs games behavior, it imports `GamesModule` and consumes `GamesService`; it must not reach into private files.
- Move code to `src/common` only when it is cross-cutting and reusable across multiple domains, such as pagination, cache decorators/interceptors, HTTP filters, or pure utilities.
- Prefer public DTOs by use case: a list can return `GameCatalogItemDto` and a detail page can return `GameDetailDto`. Do not expose Prisma models directly when the public contract should hide internal ids, timestamps, or heavy relations.
- Pagination must use helpers from `src/common/pagination` so `page`, `limit`, `total`, and `hasNextPage` stay consistent.
- Full-response caching should be declared in controllers with common decorators/interceptors. Services may invalidate namespaces when they mutate data.
- Keep controllers thin. A controller handles HTTP, declarative validation, params, response codes, and service delegation.
- Keep services as the application layer. A service orchestrates business rules, transactions, and persistence calls, but should not mix HTTP details into business logic.
- Avoid cross-module dependency cycles. If a module needs another module's capability, consume an exported provider from the owner.
- Do not introduce manual singletons, mutable global state, or direct imports that bypass NestJS dependency injection.
- Extract pure rules into testable functions/classes when logic grows. Keep those pieces free of NestJS dependencies when they do not need them.
- Prefer composition over inheritance. Use base classes only when a stable repeated abstraction already exists.

## Coupling And Dependencies

- Providers should depend on interfaces, tokens, or domain services when that meaningfully reduces coupling. Do not create empty abstractions "just in case".
- Controllers must not access the database directly.
- Do not import internal details from another module. Import from the public module boundary, or move truly shared logic to `src/common`.
- Avoid dependency cycles. Treat `forwardRef` as technical debt and document why there is no simple alternative.
- Every external integration must be encapsulated in a dedicated provider, configured through `ConfigService`, and tested with mocks/fakes.

## Allowed Design Patterns

- Dependency Injection through NestJS providers.
- Repository/Data Mapper through Prisma Client and domain services, not scattered raw queries.
- DTO + validation pipe for input contracts.
- Mapper/Presenter when the public response must not expose the persistence model directly.
- Factory only when construction has real rules or variants.
- Strategy when behavior is interchangeable by configuration or domain type.
- CQRS only when the use case justifies separating commands and queries; do not introduce it for simple CRUD.

## Persistence And Prisma

- Prisma is the target standard for database access.
- Every new persistence model must be defined in Prisma schema and accessed through `PrismaService` or a module repository that wraps it.
- Do not add new TypeORM entities. Existing TypeORM code is legacy until a planned Prisma migration removes it.
- Schema migrations must be versioned and reproducible.
- Do not use `synchronize: true` in shared, staging, or production environments.
- Raw queries are allowed only when Prisma cannot express the query clearly. They must use parameters, have tests, and document the reason outside code if the decision matters.
- Do not compare Prisma error codes as magic strings in filters, controllers, or services. Add named constants and HTTP mappings to `src/common/prisma/prisma-errors.ts`, cover them with tests, and document externally visible behavior in `docs/ERRORS.md`.

## DTOs, Inputs, Outputs, And Models

- Every HTTP input must have a dedicated DTO with `class-validator` and, when useful, `class-transformer`.
- Do not reuse database models as input DTOs.
- Define response DTOs when the public API should not mirror the internal model exactly.
- Keep names consistent: `CreateXDto`, `UpdateXDto`, `QueryXDto`, `XResponseDto`.
- Use domain enums for closed value sets and document them in Swagger.
- Do not accept unknown properties. Keep `ValidationPipe` configured with `whitelist`, `forbidNonWhitelisted`, and `transform`.

## Swagger And HTTP Contract

- Every new or modified endpoint must update Swagger when possible.
- Use `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiQuery`, `@ApiBody`, and `@ApiProperty` when they clarify the contract.
- Document expected status codes, relevant errors, and response DTOs.
- Keep `README.md` and documents in `docs/` aligned with route, environment variable, command, and contract changes.
- Do not introduce undocumented endpoints unless they are internal and explicitly justified.
- Versioned API documentation is generated with libraries, not custom handwritten output: `pnpm api:docs:generate` builds Nest, creates `docs/api/openapi.json` from `@nestjs/swagger`, then creates `docs/api/postman_collection.json` from OpenAPI with `openapi-to-postmanv2`.
- If a controller, DTO, Swagger decorator, route, or HTTP contract changes, run `pnpm api:docs:generate` and commit the generated files.

## Operational Automation

- If a task requires repeatable programmable steps, add or reuse scripts instead of spending prompts/tokens repeating manual instructions.
- `pnpm post-feature` is the expected backend trigger before creating or updating PRs: it regenerates Swagger/Postman, runs typecheck, runs tests, and verifies committed API docs.
- If `pnpm post-feature` fails because of tests or local environment, fix the cause when it is part of the change. If the failure is external or known, document it in the final response and PR.
- Do not automate destructive steps or product decisions without explicit approval.

## Required Testing

- Every new or modified file with logic must have associated unit tests.
- Every new controller or modified endpoint must have e2e or HTTP integration coverage.
- Every service with business rules, transactions, or queries must have unit tests with mocked dependencies or fakes.
- Every DTO with non-trivial validation must have validation tests or be covered by e2e invalid-input cases.
- Every bug fix must include a test that fails without the fix.
- Do not lower coverage or remove tests without equivalent replacement.
- Tests must be deterministic: no external network, uncontrolled real time, or unfixed random order.
- Before closing a change, run at minimum:
  - `pnpm typecheck`
  - `pnpm test`
  - the relevant e2e script when one exists

## Libraries And Pinning

- Prefer official NestJS libraries or broadly maintained packages before adding small or low-trust dependencies.
- Justify every new dependency in the PR or change document: problem solved, alternatives considered, and maintenance surface.
- Before adding a dependency, check maintenance, community, license, repository health, latest release date, active issues/PRs, usage volume, and known vulnerabilities.
- Prefer simple, widely used, maintained libraries over custom implementations when they solve a standard problem. Acceptable examples include Husky for Git hooks and `openapi-to-postmanv2` for Postman collection generation from OpenAPI.
- Pin exact versions in `package.json`. Do not use `^` or `~` for new dependencies.
- Keep `pnpm-lock.yaml` updated and committed.
- Do not mix broad dependency upgrades with functional changes. Put upgrades in dedicated changes.
- Review breaking changes and migration notes before major upgrades.
- Run dependency audit when adding or updating packages, and document any accepted vulnerability with reason and remediation plan.

## Git, Branches, Push, And PRs

- Work on descriptive, focused branches: `backend/<topic>`, `fix/<topic>`, or `chore/<topic>`.
- Do not push directly to `main`.
- Before committing or pushing, review `git status` and confirm no changes from another agent, conversation, or task are included.
- Before pushing, review `git branch --show-current` and confirm the branch is not old, inherited, or wrong.
- Before pushing, review `git rev-parse --abbrev-ref --symbolic-full-name @{u}` when an upstream exists and confirm it matches the same logical branch.
- The branch name must match the change scope and the PR that will be created or updated.
- If the local branch and upstream do not match, stop and fix the branch or ask for confirmation before pushing.
- Do not push from a reused branch if the current change does not exactly match that branch. Create a new descriptive branch before committing.
- Every PR must contain one logical change. Do not mix features, fixes, refactors, migrations, dependency upgrades, or unrelated docs changes.
- Do not add "one more change" to an existing PR if it does not belong to the original scope. Create another branch and PR.
- Before creating or updating a PR, confirm the branch, upstream, title, and scope all describe the same change.
- After code changes, create or update a PR unless the user explicitly says not to push, credentials are missing, or the tree has unrelated changes that make inclusion unsafe.
- Every final response after changes must state PR status. If a PR exists, include the link and explicitly ask the user to review it. If no PR exists, explain why and what is needed.
- The PR must explain scope, API/contract changes, migrations or seed data, tests run, risks, and follow-ups.
- PRs with new dependencies must include justification, audit status, and exact pinning confirmation.
- PRs with contract changes must update Swagger/OpenAPI, collections in `docs/api`, and related documentation.
- Before pushing a backend PR, prefer `pnpm post-feature` over separate commands when the change touches code or the API contract.
- Commits should be small, coherent, and imperative.
- Do not rewrite shared history without coordination.

## Documentation And Comments

- All Markdown documentation in this repository must be written in English.
- Prefer clear code, precise names, and small functions over comments.
- Do not add obvious code comments.
- If a decision needs context, document it in `docs/` or the relevant module README.
- Code comments are allowed only to explain a non-obvious constraint, security decision, complex query, or external integration with surprising behavior.
- Keep usage examples, environment variables, and commands updated.
- Game manuals, rules and material requirements must be production-ready, complete enough for users to play correctly, and source-backed. Reuse `games.status` as the logical enabled flag: only `approved` games are public/enabled, and seeded games without curated overrides must remain `pending`. Keep the curation policy in `docs/GAME_CONTENT.md` aligned with seed behavior.

## Implementation Style

- Write strict, typed TypeScript. Avoid `any`; if unavoidable, limit its scope and explain why.
- Keep functions focused on one responsibility.
- Use NestJS HTTP errors (`BadRequestException`, `NotFoundException`, etc.) at the HTTP boundary or application layer.
- Centralize configuration in `ConfigModule`/`ConfigService`.
- Avoid business logic in decorators, pipes, or interceptors; those pieces should stay small and cross-cutting.
- Do not mix large refactors with features. If a structural improvement is required, make it in separate commits.

## Delivery Checklist

- Structure respects module, controller, service, DTO, and persistence boundaries.
- No unnecessary coupling or cross-dependencies were added.
- Swagger reflects HTTP contract changes.
- Unit tests cover each new or modified logic file.
- E2E/integration coverage exists for new or modified endpoints.
- `pnpm typecheck` and `pnpm test` pass.
- New dependencies are pinned and justified.
- Relevant documentation is updated.
