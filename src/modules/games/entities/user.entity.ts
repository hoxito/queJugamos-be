import { Column, Entity, Index, OneToMany } from "typeorm";
import { AuditedEntity } from "../../../common/entities/audited.entity";
import { GameCommentEntity } from "./game-comment.entity";
import { GameRatingEntity } from "./game-rating.entity";
import { GameEntity } from "./game.entity";

export enum UserRole {
  Player = "player",
  Reviewer = "reviewer",
  Admin = "admin"
}

@Entity({ name: "users" })
export class UserEntity extends AuditedEntity {
  @Index({ unique: true })
  @Column({ type: "text" })
  email: string;

  @Column({ name: "display_name", type: "text" })
  displayName: string;

  @Index()
  @Column({ type: "enum", enum: UserRole, default: UserRole.Player })
  role: UserRole;

  @OneToMany(() => GameEntity, (game) => game.createdBy)
  games: GameEntity[];

  @OneToMany(() => GameRatingEntity, (rating) => rating.user)
  ratings: GameRatingEntity[];

  @OneToMany(() => GameCommentEntity, (comment) => comment.user)
  comments: GameCommentEntity[];
}
