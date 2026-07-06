import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateCommentDto {
  @IsUUID()
  userId: string;

  @IsString()
  bodyMd: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
