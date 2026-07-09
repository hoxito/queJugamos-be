CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE "GameStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived');
CREATE TYPE "MaterialKind" AS ENUM ('writing', 'paper', 'cards', 'board', 'tiles', 'pieces', 'blocks', 'money', 'bags', 'tokens', 'dice', 'timer', 'space', 'device', 'other');
CREATE TYPE "RequirementType" AS ENUM ('required', 'optional');
CREATE TYPE "DeckType" AS ENUM ('standard_52', 'spanish_40', 'custom');
CREATE TYPE "AssetKind" AS ENUM ('cover', 'rules_pdf', 'printable', 'image', 'video', 'other');
CREATE TYPE "AssetSourceType" AS ENUM ('manual_url', 'object_storage');
CREATE TYPE "StorageProvider" AS ENUM ('s3', 'r2', 'gcs', 'azure_blob', 'supabase', 'other');
CREATE TYPE "UserRole" AS ENUM ('player', 'reviewer', 'admin');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "email" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'player',
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "games" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "summary_md" TEXT NOT NULL,
  "rules_md" TEXT NOT NULL,
  "rules_source_url" TEXT,
  "external_source" TEXT,
  "external_id" TEXT,
  "min_players" INTEGER NOT NULL,
  "max_players" INTEGER NOT NULL,
  "min_age" INTEGER NOT NULL,
  "difficulty" "Difficulty" NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "indoor" BOOLEAN NOT NULL DEFAULT true,
  "outdoor" BOOLEAN NOT NULL DEFAULT false,
  "status" "GameStatus" NOT NULL DEFAULT 'pending',
  "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0,
  "rating_count" INTEGER NOT NULL DEFAULT 0,
  "created_by_id" UUID,
  CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "materials" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "kind" "MaterialKind" NOT NULL,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "game_materials" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "game_id" UUID NOT NULL,
  "material_id" UUID NOT NULL,
  "requirement_type" "RequirementType" NOT NULL,
  "quantity" INTEGER,
  "notes" TEXT,
  CONSTRAINT "game_materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "game_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "game_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  CONSTRAINT "game_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "card_adaptations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "game_id" UUID NOT NULL,
  "deck_type" "DeckType" NOT NULL,
  "unique_cards_needed" INTEGER NOT NULL,
  "total_cards_needed" INTEGER NOT NULL,
  "notes" TEXT,
  CONSTRAINT "card_adaptations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "card_mappings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "card_adaptation_id" UUID NOT NULL,
  "source_card" TEXT NOT NULL,
  "meaning" TEXT NOT NULL,
  "quantity" INTEGER,
  CONSTRAINT "card_mappings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "game_assets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "game_id" UUID NOT NULL,
  "kind" "AssetKind" NOT NULL,
  "source_type" "AssetSourceType" NOT NULL,
  "public_url" TEXT,
  "source_url" TEXT,
  "credit" TEXT,
  "license_label" TEXT,
  "storage_provider" "StorageProvider",
  "bucket" TEXT,
  "object_key" TEXT,
  "content_type" TEXT,
  "size_bytes" BIGINT,
  "alt_text" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "game_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "game_ratings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "game_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "value" INTEGER NOT NULL,
  "comment" TEXT,
  CONSTRAINT "game_ratings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_game_ratings_value" CHECK ("value" >= 1 AND "value" <= 5)
);

CREATE TABLE "game_comments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "game_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "parent_id" UUID,
  "body_md" TEXT NOT NULL,
  CONSTRAINT "game_comments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");
CREATE INDEX "idx_games_player_range" ON "games"("min_players", "max_players");
CREATE INDEX "idx_games_search_filters" ON "games"("status", "difficulty", "outdoor", "min_age");
CREATE INDEX "games_min_age_idx" ON "games"("min_age");
CREATE INDEX "games_difficulty_idx" ON "games"("difficulty");
CREATE INDEX "games_outdoor_idx" ON "games"("outdoor");
CREATE INDEX "games_status_idx" ON "games"("status");
CREATE UNIQUE INDEX "materials_slug_key" ON "materials"("slug");
CREATE INDEX "materials_kind_idx" ON "materials"("kind");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE UNIQUE INDEX "idx_game_materials_game_material" ON "game_materials"("game_id", "material_id");
CREATE INDEX "idx_game_materials_material_requirement" ON "game_materials"("material_id", "requirement_type");
CREATE UNIQUE INDEX "idx_game_categories_game_category" ON "game_categories"("game_id", "category_id");
CREATE INDEX "idx_game_categories_category" ON "game_categories"("category_id");
CREATE INDEX "idx_card_adaptations_game" ON "card_adaptations"("game_id");
CREATE INDEX "idx_card_mappings_adaptation" ON "card_mappings"("card_adaptation_id");
CREATE INDEX "idx_game_assets_game_kind" ON "game_assets"("game_id", "kind");
CREATE INDEX "idx_game_assets_storage_object" ON "game_assets"("storage_provider", "bucket", "object_key");
CREATE INDEX "idx_game_ratings_game" ON "game_ratings"("game_id");
CREATE UNIQUE INDEX "idx_game_ratings_user_game_active" ON "game_ratings"("user_id", "game_id") WHERE "deleted_at" IS NULL;
CREATE INDEX "idx_game_comments_game_created" ON "game_comments"("game_id", "created_at");
CREATE INDEX "idx_game_comments_parent" ON "game_comments"("parent_id");

ALTER TABLE "games" ADD CONSTRAINT "games_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "game_materials" ADD CONSTRAINT "game_materials_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_materials" ADD CONSTRAINT "game_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_categories" ADD CONSTRAINT "game_categories_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_categories" ADD CONSTRAINT "game_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_adaptations" ADD CONSTRAINT "card_adaptations_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "card_mappings" ADD CONSTRAINT "card_mappings_card_adaptation_id_fkey" FOREIGN KEY ("card_adaptation_id") REFERENCES "card_adaptations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_assets" ADD CONSTRAINT "game_assets_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_ratings" ADD CONSTRAINT "game_ratings_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_ratings" ADD CONSTRAINT "game_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_comments" ADD CONSTRAINT "game_comments_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_comments" ADD CONSTRAINT "game_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_comments" ADD CONSTRAINT "game_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "game_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
