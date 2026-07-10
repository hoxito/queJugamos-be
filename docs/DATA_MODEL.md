# Data Model

The source of truth for the schema is `prisma/schema.prisma`. Versioned migrations live in `prisma/migrations`, and the idempotent seed lives in `prisma/seed.cjs`.

## Slug

A `slug` is a human-readable URL identifier derived from a name and unique per public entity.

Examples:

- `Tateti` -> `tateti`
- `Homemade Exploding Kittens` -> `homemade-exploding-kittens`
- `Common Deck` -> `common-deck`

It does not replace the UUID `id`. The UUID is the stable internal identity; the slug is for routes, SEO, deep links, and shareable URLs.

## Soft Delete

Editable or user-visible entities have `deleted_at`. This lets the API hide content without breaking histories, ratings, comments, reviews, or file references.

## Markdown

Long text is stored as Markdown:

- `summary_md`: short summary with simple formatting.
- `rules_md`: complete rules or extended version.

Clients must render sanitized Markdown. Arbitrary HTML must not be accepted without sanitization.

## Game

```ts
type Game = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  summaryMd: string;
  rulesMd: string;
  minPlayers: number;
  maxPlayers: number;
  minAge: number;
  difficulty: "easy" | "medium" | "hard";
  durationMinutes: number;
  indoor: boolean;
  outdoor: boolean;
  requiredMaterials: Material[];
  optionalMaterials: Material[];
  categories: GameCategory[];
  rulesPreview: string[];
  cardAdaptation?: CardAdaptation;
  assets: GameAsset[];
  ratingAverage: number;
  ratingCount: number;
  status: "approved" | "pending" | "rejected";
  deletedAt?: string;
};
```

## Material

```ts
type Material = {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  kind: "writing" | "paper" | "cards" | "tokens" | "space" | "device" | "other";
  deletedAt?: string;
};
```

## GameAsset

Game files are modeled in a vendor-agnostic way. An asset can be a manual URL or an object in S3, R2, Azure Blob, GCS, Supabase Storage, or another compatible provider.

```ts
type GameAsset = {
  id: string;
  gameId: string;
  kind: "cover" | "rules_pdf" | "printable" | "image" | "video" | "other";
  sourceType: "manual_url" | "object_storage";
  publicUrl?: string;
  storageProvider?: "s3" | "r2" | "gcs" | "azure_blob" | "supabase" | "other";
  bucket?: string;
  objectKey?: string;
  contentType?: string;
  sizeBytes?: number;
  altText?: string;
  sortOrder: number;
  deletedAt?: string;
};
```

## CardAdaptation

```ts
type CardAdaptation = {
  deckType: "standard-52" | "spanish-40" | "custom";
  uniqueCardsNeeded: number;
  totalCardsNeeded: number;
  mappings: {
    source: string;
    means: string;
    quantity?: number;
  }[];
  notes: string;
};
```

## Submission

```ts
type GameSubmission = {
  id: string;
  authorId: string;
  draft: Game;
  status: "pending" | "approved" | "changes_requested" | "rejected";
  reviewerId?: string;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Rating

```ts
type GameRating = {
  id: string;
  gameId: string;
  userId: string;
  value: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  deletedAt?: string;
};
```

Public API responses expose ratings as display data. Catalog items include `ratingAverage: number` and `ratingCount: number`; game detail additionally includes a `ratings` array with rating values and optional comments.

## Public DTOs

`GET /games` and `POST /games/query` return a paginated catalog DTO:

```ts
type PaginatedGames = {
  items: GameCatalogItem[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};
```

Catalog items intentionally omit internal ids and timestamps. `GET /games/:slug` returns `GameDetail`, which adds `rulesMd`, `galleryImages`, `downloadableAssets`, `referenceLinks`, and public ratings.

## Comment

```ts
type GameComment = {
  id: string;
  gameId: string;
  userId: string;
  bodyMd: string;
  parentId?: string;
  deletedAt?: string;
};
```

## Recommended Indexes

- `games.slug` unique.
- `games.status`, `games.deleted_at`.
- `games.min_players`, `games.max_players`, `games.min_age`, `games.difficulty`, `games.outdoor`.
- `materials.slug` unique.
- `materials.kind`.
- `game_materials.material_id`.
- `game_materials.game_id`.
- `game_materials.material_id, requirement_type`.
- `game_categories.category_id`.
- `game_ratings.game_id`.
- `game_ratings.game_id, user_id` unique when `deleted_at IS NULL`.
- `game_comments.game_id, created_at`.
- `game_assets.game_id, kind`.
