# Game Content Curation

Game rules, manual links, materials and assets must be curated as source-backed data, not generated from a generic template.

## Copyright And Manual Sources

- Do not copy proprietary rulebooks or publisher manuals into `rulesMd`.
- If an official or publisher PDF is publicly reachable but does not clearly grant redistribution rights, store it only as an external `GameAsset` with `sourceType: "manual_url"`, `kind: "rules_pdf"`, the original URL, attribution and license label.
- Upload or mirror a PDF into object storage only when the source license or written permission allows redistribution.
- Public-domain traditional games may use original project wording for rules, with a source URL kept for verification.
- Wikipedia and similar references may be used as source links, but rules text in the database must be original project wording unless the compatible license and attribution requirements are intentionally handled.

## Data Location

- Base game rows live in `database/curated-games.json` and `prisma/seed.cjs`.
- Source-backed manual overrides live in `database/game-content-overrides.json`.
- The seed merges overrides by game slug. If an override exists, it owns `summaryMd`, `rulesMd`, `rulesSourceUrl`, material quantities/notes and manual/reference assets for that game.

## Required Fields For A Curated Manual

Each curated override should include:

- `summaryMd`: short public summary.
- `rulesMd`: original Markdown rules written for this project.
- `rulesSourceUrl`: best available source used to validate the rules.
- `sourceLabel`: human-readable source name.
- `sourceLicenseLabel`: license or usage status.
- `materialRequirements`: per-material quantity and usage notes.
- `assets`: official/public reference links, PDFs, images or videos with attribution.

## PDF Handling

Use this asset shape for a linked official PDF:

```json
{
  "kind": "rules_pdf",
  "publicUrl": "https://publisher.example/game/rules.pdf",
  "sourceUrl": "https://publisher.example/game/rules.pdf",
  "credit": "Publisher Name",
  "licenseLabel": "Official external PDF reference; not mirrored",
  "contentType": "application/pdf",
  "altText": "Game official rulebook PDF",
  "sortOrder": 100
}
```

Use `sourceType: "object_storage"` only after redistribution permission is confirmed and the file has actually been uploaded to the configured storage provider.
