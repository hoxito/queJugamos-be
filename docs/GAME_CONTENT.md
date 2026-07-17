# Game Content Curation

Game rules, manual links, materials and assets must be production-ready, source-backed data, not generated from a generic template.

## Publication Status

- `games.status` is the logical enabled flag.
- `approved` means enabled and visible in the public catalog.
- `pending`, `draft`, `rejected` and `archived` are not visible in the public catalog or public game detail endpoint.
- Public clients must use `GET /api/v1/games` or `POST /api/v1/games/query` for catalog pages and `GET /api/v1/games/:slug` for public detail pages; these responses only include approved games.
- Admin and reviewer clients must use the protected moderation endpoints for non-approved games: `GET /api/v1/games/moderation/pending` for the queue and `GET /api/v1/games/moderation/:slug` for full detail.
- API responses include `status`; clients should display a "not approved" badge for non-approved games in moderation surfaces instead of inferring state locally.
- The seed only marks games with curated production-ready overrides as `approved`.
- All other seeded games remain `pending` until a moderator approves them through the moderation flow.

## Data Location

- Base game rows live in `database/curated-games.json` and `prisma/seed.cjs`.
- Source-backed manual overrides live in `database/game-content-overrides.json`.
- The seed merges overrides by game slug. If an override exists, it owns `summaryMd`, `rulesMd`, `rulesSourceUrl`, material quantities/notes and manual/reference assets for that game.
- A game is considered production-ready for seeded publication when it has an override in `database/game-content-overrides.json`.

## Required Fields For A Curated Manual

Each curated override should include:

- `summaryMd`: short public summary.
- `rulesMd`: complete playable Markdown rules.
- `rulesSourceUrl`: best available source used to validate the rules.
- `sourceLabel`: human-readable source name.
- `sourceLicenseLabel`: license or usage status.
- `materialRequirements`: per-material quantity and usage notes.
- `assets`: official/public reference links, PDFs, images or videos with attribution.

## Asset Handling

Use this asset shape for a linked PDF:

```json
{
  "kind": "rules_pdf",
  "publicUrl": "https://publisher.example/game/rules.pdf",
  "sourceUrl": "https://publisher.example/game/rules.pdf",
  "credit": "Source Name",
  "licenseLabel": "External PDF reference",
  "contentType": "application/pdf",
  "altText": "Game official rulebook PDF",
  "sortOrder": 100
}
```

Use `sourceType: "manual_url"` for linked references and `sourceType: "object_storage"` for uploaded files that exist in the configured storage provider.
