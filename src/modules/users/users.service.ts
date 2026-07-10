import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserRole } from "./domain/user-role.enum";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" }
    });
  }

  create(dto: CreateUserDto) {
    return this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        displayName: dto.displayName,
        ...(dto.role ? { role: dto.role } : {})
      },
      create: {
        email: dto.email,
        displayName: dto.displayName,
        role: dto.role ?? UserRole.Player
      }
    });
  }
}
