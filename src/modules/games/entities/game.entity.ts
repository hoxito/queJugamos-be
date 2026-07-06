import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { AuditedEntity } from "../../../common/entities/audited.entity";
import { Difficulty, GameStatus } from "../domain/game.enums";
import { CardAdaptationEntity } from "./card-adaptation.entity";
import { GameAssetEntity } from "./game-asset.entity";
import { GameCategoryEntity } from "./game-category.entity";
import { GameCommentEntity } from "./game-comment.entity";
import { GameMaterialEntity } from "./game-material.entity";
import { GameRatingEntity } from "./game-rating.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "games" })
@Index("idx_games_player_range", ["minPlayers", "maxPlayers"])
@Index("idx_games_search_filters", ["status", "difficulty", "outdoor", "minAge"])
export class GameEntity extends AuditedEntity {
  @Column({ type: "text" })
  title: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  slug: string;

  @Column({ name: "summary_md", type: "text" })
  summaryMd: string;

  @Column({ name: "rules_md", type: "text" })
  rulesMd: string;

  @Column({ name: "rules_source_url", type: "text", nullable: true })
  rulesSourceUrl?: string | null;

  @Column({ name: "external_source", type: "text", nullable: true })
  externalSource?: string | null;

  @Column({ name: "external_id", type: "text", nullable: true })
  externalId?: string | null;

  @Column({ name: "min_players", type: "int" })
  minPlayers: number;

  @Column({ name: "max_players", type: "int" })
  maxPlayers: number;

  @Index()
  @Column({ name: "min_age", type: "int" })
  minAge: number;

  @Index()
  @Column({ type: "enum", enum: Difficulty })
  difficulty: Difficulty;

  @Column({ name: "duration_minutes", type: "int" })
  durationMinutes: number;

  @Column({ type: "boolean", default: true })
  indoor: boolean;

  @Index()
  @Column({ type: "boolean", default: false })
  outdoor: boolean;

  @Index()
  @Column({ type: "enum", enum: GameStatus, default: GameStatus.Pending })
  status: GameStatus;

  @Column({ name: "rating_average", type: "numeric", precision: 3, scale: 2, default: 0 })
  ratingAverage: string;

  @Column({ name: "rating_count", type: "int", default: 0 })
  ratingCount: number;

  @ManyToOne(() => UserEntity, (user) => user.games, { nullable: true })
  @JoinColumn({ name: "created_by_id" })
  createdBy?: UserEntity | null;

  @OneToMany(() => GameMaterialEntity, (gameMaterial) => gameMaterial.game, { cascade: true })
  materials: GameMaterialEntity[];

  @OneToMany(() => GameCategoryEntity, (gameCategory) => gameCategory.game, { cascade: true })
  categories: GameCategoryEntity[];

  @OneToMany(() => CardAdaptationEntity, (adaptation) => adaptation.game, { cascade: true })
  cardAdaptations: CardAdaptationEntity[];

  @OneToMany(() => GameAssetEntity, (asset) => asset.game, { cascade: true })
  assets: GameAssetEntity[];

  @OneToMany(() => GameRatingEntity, (rating) => rating.game)
  ratings: GameRatingEntity[];

  @OneToMany(() => GameCommentEntity, (comment) => comment.game)
  comments: GameCommentEntity[];
}
