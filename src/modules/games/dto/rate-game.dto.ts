import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class RateGameDto {
  @IsUUID()
  userId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  value: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
