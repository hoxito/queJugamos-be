# Modelo de datos

## Slug

Un `slug` es un identificador legible para URLs, derivado de un nombre humano y unico por entidad publica.

Ejemplos:

- `Tateti` -> `tateti`
- `Gatitos explosivos casero` -> `gatitos-explosivos-casero`
- `Mazo comun` -> `mazo-comun`

No reemplaza al `id` UUID. El UUID es la identidad interna estable; el slug sirve para rutas, SEO, deep links y URLs compartibles.

## Borrado logico

Las entidades editables o visibles por usuarios tienen `deleted_at`. Esto permite ocultar contenido sin romper historiales, ratings, comentarios, revisiones o referencias de archivos.

## Markdown

Los textos largos se guardan como Markdown:

- `summary_md`: resumen con estilos simples.
- `rules_md`: reglas completas o version extendida.

La app debe renderizar Markdown sanitizado. No se debe aceptar HTML arbitrario sin sanitizacion.

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

Los archivos de un juego se modelan de forma vendor-agnostic. Puede ser una URL manual o un objeto en S3, R2, Azure Blob, GCS, Supabase Storage, etc.

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

## Indices recomendados

- `games.slug` unico.
- `games.status`, `games.deleted_at`.
- `games.min_players`, `games.max_players`, `games.min_age`, `games.difficulty`, `games.outdoor`.
- `materials.slug` unico.
- `materials.kind`.
- `game_materials.material_id`.
- `game_materials.game_id`.
- `game_materials.material_id, requirement_type`.
- `game_categories.category_id`.
- `game_ratings.game_id`.
- `game_ratings.game_id, user_id` unico cuando `deleted_at IS NULL`.
- `game_comments.game_id, created_at`.
- `game_assets.game_id, kind`.
