import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RequirementType } from "../domain/game.enums";
import { GameEntity } from "./game.entity";
import { MaterialEntity } from "./material.entity";

@Entity({ name: "game_materials" })
@Index("idx_game_materials_game_material", ["gameId", "materialId"], { unique: true })
@Index("idx_game_materials_material_requirement", ["materialId", "requirementType"])
export class GameMaterialEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "game_id", type: "uuid" })
  gameId: string;

  @Column({ name: "material_id", type: "uuid" })
  materialId: string;

  @Column({ name: "requirement_type", type: "enum", enum: RequirementType })
  requirementType: RequirementType;

  @Column({ type: "int", nullable: true })
  quantity?: number | null;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @ManyToOne(() => GameEntity, (game) => game.materials, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game: GameEntity;

  @ManyToOne(() => MaterialEntity, (material) => material.gameMaterials, { eager: true })
  @JoinColumn({ name: "material_id" })
  material: MaterialEntity;
}
