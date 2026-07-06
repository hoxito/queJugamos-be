import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { AuditedEntity } from "../../../common/entities/audited.entity";
import { CardAdaptationEntity } from "./card-adaptation.entity";

@Entity({ name: "card_mappings" })
@Index("idx_card_mappings_adaptation", ["cardAdaptationId"])
export class CardMappingEntity extends AuditedEntity {
  @Column({ name: "card_adaptation_id", type: "uuid" })
  cardAdaptationId: string;

  @Column({ name: "source_card", type: "text" })
  sourceCard: string;

  @Column({ type: "text" })
  meaning: string;

  @Column({ type: "int", nullable: true })
  quantity?: number | null;

  @ManyToOne(() => CardAdaptationEntity, (adaptation) => adaptation.mappings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_adaptation_id" })
  cardAdaptation: CardAdaptationEntity;
}
