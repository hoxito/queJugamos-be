import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { GameStatus } from "../domain/game.enums";

export class ModerateGameDto {
  @ApiPropertyOptional({
    description: "Moderator decision. Only approved or rejected are accepted.",
    enum: [GameStatus.Approved, GameStatus.Rejected],
    example: GameStatus.Approved
  })
  @IsIn([GameStatus.Approved, GameStatus.Rejected])
  status: GameStatus.Approved | GameStatus.Rejected;

  @ApiPropertyOptional({
    description: "Optional internal moderation note.",
    example: "Approved after checking materials and rules."
  })
  @IsOptional()
  @IsString()
  note?: string;
}
