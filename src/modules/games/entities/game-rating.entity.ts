import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { AuditedEntity } from "../../../common/entities/audited.entity";
import { GameEntity } from "./game.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "game_ratings" })
@Check("chk_game_ratings_value", "value >= 1 AND value <= 5")
@Index("idx_game_ratings_game", ["gameId"])
@Index("idx_game_ratings_user_game_active", ["userId", "gameId"], {
  unique: true,
  where: "deleted_at IS NULL"
})
export class GameRatingEntity extends AuditedEntity {
  @Column({ name: "game_id", type: "uuid" })
  gameId: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "int" })
  value: number;

  @Column({ type: "text", nullable: true })
  comment?: string | null;

  @ManyToOne(() => GameEntity, (game) => game.ratings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game: GameEntity;

  @ManyToOne(() => UserEntity, (user) => user.ratings)
  @JoinColumn({ name: "user_id" })
  user: UserEntity;
}
