import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { Difficulty } from "../domain/game.enums";

export class QueryGamesDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsArray()
  materialIds?: string[];

  @IsOptional()
  @IsArray()
  materialSlugs?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  players?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAge?: number;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  outdoorOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
