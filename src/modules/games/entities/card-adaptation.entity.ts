import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { AuditedEntity } from "../../../common/entities/audited.entity";
import { DeckType } from "../domain/game.enums";
import { CardMappingEntity } from "./card-mapping.entity";
import { GameEntity } from "./game.entity";

@Entity({ name: "card_adaptations" })
@Index("idx_card_adaptations_game", ["gameId"])
export class CardAdaptationEntity extends AuditedEntity {
  @Column({ name: "game_id", type: "uuid" })
  gameId: string;

  @Column({ name: "deck_type", type: "enum", enum: DeckType })
  deckType: DeckType;

  @Column({ name: "unique_cards_needed", type: "int" })
  uniqueCardsNeeded: number;

  @Column({ name: "total_cards_needed", type: "int" })
  totalCardsNeeded: number;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @ManyToOne(() => GameEntity, (game) => game.cardAdaptations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game: GameEntity;

  @OneToMany(() => CardMappingEntity, (mapping) => mapping.cardAdaptation, { cascade: true })
  mappings: CardMappingEntity[];
}
