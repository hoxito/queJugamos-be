import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Difficulty } from "../domain/game.enums";

export class QueryGamesDto {
  @ApiPropertyOptional({
    description: "Text search against title, summary and rules.",
    example: "cards"
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: "Material UUIDs owned by the player.",
    type: [String],
    example: ["11111111-1111-1111-1111-111111111111"]
  })
  @IsOptional()
  @IsArray()
  materialIds?: string[];

  @ApiPropertyOptional({
    description: "Material slugs owned by the player.",
    type: [String],
    example: ["cards", "dice"]
  })
  @IsOptional()
  @IsArray()
  materialSlugs?: string[];

  @ApiPropertyOptional({
    description: "Number of players available.",
    minimum: 1,
    maximum: 100,
    example: 4
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  players?: number;

  @ApiPropertyOptional({
    description: "Maximum allowed minimum age.",
    minimum: 0,
    example: 8
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAge?: number;

  @ApiPropertyOptional({
    description: "Game difficulty filter.",
    enum: Difficulty,
    example: Difficulty.Medium
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: "When true, only return games playable outdoors.",
    example: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  outdoorOnly?: boolean;

  @ApiPropertyOptional({
    description: "Page number for catalog pagination.",
    minimum: 1,
    default: 1,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: "Maximum number of games to return.",
    minimum: 1,
    maximum: 100,
    default: 30,
    example: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
