import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ example: "Cartas" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "cartas" })
  @IsOptional()
  @IsString()
  slug?: string;
}
