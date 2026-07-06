import { Column, Entity, Index, OneToMany } from "typeorm";
import { AuditedEntity } from "../../../common/entities/audited.entity";
import { MaterialKind } from "../domain/game.enums";
import { GameMaterialEntity } from "./game-material.entity";

@Entity({ name: "materials" })
export class MaterialEntity extends AuditedEntity {
  @Column({ type: "text" })
  name: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  slug: string;

  @Index()
  @Column({ type: "enum", enum: MaterialKind })
  kind: MaterialKind;

  @Column({ type: "text", array: true, default: "{}" })
  aliases: string[];

  @OneToMany(() => GameMaterialEntity, (gameMaterial) => gameMaterial.material)
  gameMaterials: GameMaterialEntity[];
}
