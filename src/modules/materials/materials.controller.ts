import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../users/domain/user-role.enum";
import { CreateMaterialDto } from "./dto/create-material.dto";
import { MaterialsService } from "./materials.service";

@ApiTags("materials")
@Controller("materials")
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  list() {
    return this.materialsService.list();
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Idempotently create or update a material. Admin only." })
  create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }
}
