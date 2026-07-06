import { Column, Entity, Index, OneToMany } from "typeorm";
import { AuditedEntity } from "../../../common/entities/audited.entity";
import { GameCategoryEntity } from "./game-category.entity";

@Entity({ name: "categories" })
export class CategoryEntity extends AuditedEntity {
  @Column({ type: "text" })
  name: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  slug: string;

  @OneToMany(() => GameCategoryEntity, (gameCategory) => gameCategory.category)
  gameCategories: GameCategoryEntity[];
}
