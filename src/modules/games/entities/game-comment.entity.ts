import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { AuditedEntity } from "../../../common/entities/audited.entity";
import { GameEntity } from "./game.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "game_comments" })
@Index("idx_game_comments_game_created", ["gameId", "createdAt"])
@Index("idx_game_comments_parent", ["parentId"])
export class GameCommentEntity extends AuditedEntity {
  @Column({ name: "game_id", type: "uuid" })
  gameId: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId?: string | null;

  @Column({ name: "body_md", type: "text" })
  bodyMd: string;

  @ManyToOne(() => GameEntity, (game) => game.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game: GameEntity;

  @ManyToOne(() => UserEntity, (user) => user.comments)
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @ManyToOne(() => GameCommentEntity, (comment) => comment.replies, { nullable: true })
  @JoinColumn({ name: "parent_id" })
  parent?: GameCommentEntity | null;

  @OneToMany(() => GameCommentEntity, (comment) => comment.parent)
  replies: GameCommentEntity[];
}
