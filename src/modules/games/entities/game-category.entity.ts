import { Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column } from "typeorm";
import { CategoryEntity } from "./category.entity";
import { GameEntity } from "./game.entity";

@Entity({ name: "game_categories" })
@Index("idx_game_categories_game_category", ["gameId", "categoryId"], { unique: true })
@Index("idx_game_categories_category", ["categoryId"])
export class GameCategoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "game_id", type: "uuid" })
  gameId: string;

  @Column({ name: "category_id", type: "uuid" })
  categoryId: string;

  @ManyToOne(() => GameEntity, (game) => game.categories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game: GameEntity;

  @ManyToOne(() => CategoryEntity, (category) => category.gameCategories, { eager: true })
  @JoinColumn({ name: "category_id" })
  category: CategoryEntity;
}
