import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";
import { MaterialKind } from "../../games/domain/game.enums";

export class CreateMaterialDto {
  @ApiProperty({ example: "Papel" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "paper" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ enum: MaterialKind, example: MaterialKind.Paper })
  @IsEnum(MaterialKind)
  kind: MaterialKind;

  @ApiPropertyOptional({ type: [String], example: ["hoja", "cuaderno"] })
  @IsOptional()
  @IsArray()
  aliases?: string[];
}
