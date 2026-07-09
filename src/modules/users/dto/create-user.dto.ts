import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { UserRole } from "../domain/user-role.enum";

export class CreateUserDto {
  @ApiProperty({ example: "player@quejugamos.local" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Player One" })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.Player })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
