import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class RateGameDto {
  @ApiProperty({
    description: "UUID of the user rating the game.",
    format: "uuid",
    example: "11111111-1111-1111-1111-111111111111"
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: "Rating value from 1 to 5.",
    minimum: 1,
    maximum: 5,
    example: 5
  })
  @IsInt()
  @Min(1)
  @Max(5)
  value: number;

  @ApiPropertyOptional({
    description: "Optional user comment for the rating.",
    example: "Great for quick family sessions."
  })
  @IsOptional()
  @IsString()
  comment?: string;
}