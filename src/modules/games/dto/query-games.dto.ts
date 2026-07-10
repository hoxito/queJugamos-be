import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Difficulty } from "../domain/game.enums";

const toStringArray = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") return undefined;
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) =>
    typeof item === "string"
      ? item
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
      : []
  );
};

export class QueryGamesDto {
  @ApiPropertyOptional({
    description: "Text search against title, summary and rules.",
    example: "cards"
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description:
      "Material UUIDs selected by the user. The backend filters the full catalog by required material matches before ordering and paginating.",
    type: String,
    isArray: true,
    example: ["11111111-1111-1111-1111-111111111111"]
  })
  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  materialIds?: string[];

  @ApiPropertyOptional({
    description:
      "Material slugs selected by the user. Fully playable games are ranked before games requiring extra materials.",
    type: String,
    isArray: true,
    example: ["paper", "pen"]
  })
  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
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
