import { Injectable } from "@nestjs/common";
import { toSlug } from "../../common/slug";
import { PrismaService } from "../prisma/prisma.service";
import { RedisCacheService } from "../redis/redis-cache.service";
import { CreateMaterialDto } from "./dto/create-material.dto";

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService
  ) {}

  async list() {
    const cacheKey = "materials:list";
    const cached = await this.cache.getJson(cacheKey);
    if (cached) return cached;

    const materials = await this.prisma.material.findMany({
      where: { deletedAt: null },
      orderBy: [{ kind: "asc" }, { name: "asc" }]
    });
    await this.cache.setJson(cacheKey, materials, 300);
    return materials;
  }

  async create(dto: CreateMaterialDto) {
    const material = await this.prisma.material.create({
      data: {
        name: dto.name,
        slug: dto.slug ? toSlug(dto.slug) : toSlug(dto.name),
        kind: dto.kind,
        aliases: dto.aliases ?? []
      }
    });
    await this.cache.del("materials:list");
    return material;
  }
}
