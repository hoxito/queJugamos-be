# QueJugamos ERD

```mermaid
erDiagram
  users ||--o{ games : creates
  users ||--o{ game_ratings : rates
  users ||--o{ game_comments : comments

  games ||--o{ game_materials : needs
  materials ||--o{ game_materials : used_by

  games ||--o{ game_categories : classified_as
  categories ||--o{ game_categories : groups

  games ||--o{ card_adaptations : adapts_cards
  card_adaptations ||--o{ card_mappings : maps

  games ||--o{ game_assets : has_files
  games ||--o{ game_ratings : receives
  games ||--o{ game_comments : receives
  game_comments ||--o{ game_comments : replies

  users {
    uuid id PK
    text email UK
    text display_name
    enum role
    timestamptz deleted_at
  }

  games {
    uuid id PK
    text title
    text slug UK
    text summary_md
    text rules_md
    int min_players
    int max_players
    int min_age
    enum difficulty
    int duration_minutes
    boolean indoor
    boolean outdoor
    enum status
    numeric rating_average
    int rating_count
    timestamptz deleted_at
  }

  materials {
    uuid id PK
    text name
    text slug UK
    enum kind
    text[] aliases
    timestamptz deleted_at
  }

  game_materials {
    uuid id PK
    uuid game_id FK
    uuid material_id FK
    enum requirement_type
    int quantity
    text notes
  }

  categories {
    uuid id PK
    text name
    text slug UK
    timestamptz deleted_at
  }

  game_assets {
    uuid id PK
    uuid game_id FK
    enum kind
    enum source_type
    text public_url
    enum storage_provider
    text bucket
    text object_key
    text content_type
    bigint size_bytes
    text alt_text
    int sort_order
    timestamptz deleted_at
  }

  game_ratings {
    uuid id PK
    uuid game_id FK
    uuid user_id FK
    int value
    text comment
    timestamptz deleted_at
  }

  game_comments {
    uuid id PK
    uuid game_id FK
    uuid user_id FK
    uuid parent_id FK
    text body_md
    timestamptz deleted_at
  }
```

Key indexes live in the TypeORM entities and include:

- `games.slug` unique.
- `games.status, difficulty, outdoor, min_age`.
- `games.min_players, max_players`.
- `materials.slug` unique.
- `game_materials.material_id, requirement_type`.
- `game_materials.game_id, material_id` unique.
- `game_assets.game_id, kind`.
- `game_ratings.game_id` and active unique `user_id, game_id`.
- `game_comments.game_id, created_at`.
