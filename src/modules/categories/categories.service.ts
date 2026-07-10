import { Injectable } from "@nestjs/common";
import { toSlug } from "../../common/slug";
import { PrismaService } from "../prisma/prisma.service";
import { RedisCacheService } from "../redis/redis-cache.service";
import { CreateCategoryDto } from "./dto/create-category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService
  ) {}

  async list() {
    const cacheKey = "categories:list";
    const cached = await this.cache.getJson(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" }
    });
    await this.cache.setJson(cacheKey, categories, 300);
    return categories;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ? toSlug(dto.slug) : toSlug(dto.name);
    const category = await this.prisma.category.upsert({
      where: { slug },
      update: {
        name: dto.name
      },
      create: {
        name: dto.name,
        slug
      }
    });
    await this.cache.del("categories:list");
    return category;
  }
}
