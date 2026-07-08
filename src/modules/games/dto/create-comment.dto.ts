import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateCommentDto {
  @ApiProperty({
    description: "UUID of the comment author.",
    format: "uuid",
    example: "11111111-1111-1111-1111-111111111111"
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: "Comment body in Markdown.",
    example: "Works well with kids if you shorten the rounds."
  })
  @IsString()
  bodyMd: string;

  @ApiPropertyOptional({
    description: "Parent comment UUID when replying to another comment.",
    format: "uuid",
    example: "22222222-2222-2222-2222-222222222222"
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}