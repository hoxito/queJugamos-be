BEGIN;

CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE "GameStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived');
CREATE TYPE "MaterialKind" AS ENUM ('writing', 'paper', 'cards', 'tokens', 'dice', 'timer', 'space', 'device', 'other');
CREATE TYPE "RequirementType" AS ENUM ('required', 'optional');
CREATE TYPE "DeckType" AS ENUM ('standard_52', 'spanish_40', 'custom');
CREATE TYPE "AssetKind" AS ENUM ('cover', 'rules_pdf', 'printable', 'image', 'video', 'other');
CREATE TYPE "AssetSourceType" AS ENUM ('manual_url', 'object_storage');
CREATE TYPE "StorageProvider" AS ENUM ('s3', 'r2', 'gcs', 'azure_blob', 'supabase', 'other');
CREATE TYPE "UserRole" AS ENUM ('player', 'reviewer', 'admin');

ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE "UserRole" USING role::text::"UserRole";
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'player';

ALTER TABLE games ALTER COLUMN status DROP DEFAULT;
ALTER TABLE games ALTER COLUMN difficulty TYPE "Difficulty" USING difficulty::text::"Difficulty";
ALTER TABLE games ALTER COLUMN status TYPE "GameStatus" USING status::text::"GameStatus";
ALTER TABLE games ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE materials ALTER COLUMN kind TYPE "MaterialKind" USING kind::text::"MaterialKind";
ALTER TABLE game_materials ALTER COLUMN requirement_type TYPE "RequirementType" USING requirement_type::text::"RequirementType";
ALTER TABLE card_adaptations ALTER COLUMN deck_type TYPE "DeckType" USING deck_type::text::"DeckType";
ALTER TABLE game_assets ALTER COLUMN kind TYPE "AssetKind" USING kind::text::"AssetKind";
ALTER TABLE game_assets ALTER COLUMN source_type TYPE "AssetSourceType" USING source_type::text::"AssetSourceType";
ALTER TABLE game_assets ALTER COLUMN storage_provider TYPE "StorageProvider" USING storage_provider::text::"StorageProvider";

COMMIT;
