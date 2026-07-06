import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { AuditedEntity } from "../../../common/entities/audited.entity";
import { AssetKind, AssetSourceType, StorageProvider } from "../domain/game.enums";
import { GameEntity } from "./game.entity";

@Entity({ name: "game_assets" })
@Index("idx_game_assets_game_kind", ["gameId", "kind"])
@Index("idx_game_assets_storage_object", ["storageProvider", "bucket", "objectKey"])
export class GameAssetEntity extends AuditedEntity {
  @Column({ name: "game_id", type: "uuid" })
  gameId: string;

  @Column({ type: "enum", enum: AssetKind })
  kind: AssetKind;

  @Column({ name: "source_type", type: "enum", enum: AssetSourceType })
  sourceType: AssetSourceType;

  @Column({ name: "public_url", type: "text", nullable: true })
  publicUrl?: string | null;

  @Column({ name: "source_url", type: "text", nullable: true })
  sourceUrl?: string | null;

  @Column({ name: "credit", type: "text", nullable: true })
  credit?: string | null;

  @Column({ name: "license_label", type: "text", nullable: true })
  licenseLabel?: string | null;

  @Column({ name: "storage_provider", type: "enum", enum: StorageProvider, nullable: true })
  storageProvider?: StorageProvider | null;

  @Column({ type: "text", nullable: true })
  bucket?: string | null;

  @Column({ name: "object_key", type: "text", nullable: true })
  objectKey?: string | null;

  @Column({ name: "content_type", type: "text", nullable: true })
  contentType?: string | null;

  @Column({ name: "size_bytes", type: "bigint", nullable: true })
  sizeBytes?: string | null;

  @Column({ name: "alt_text", type: "text", nullable: true })
  altText?: string | null;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder: number;

  @ManyToOne(() => GameEntity, (game) => game.assets, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game: GameEntity;
}
