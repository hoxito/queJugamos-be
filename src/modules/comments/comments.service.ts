import { Injectable } from "@nestjs/common";
import { CreateCommentDto } from "../games/dto/create-comment.dto";
import { GamesService } from "../games/games.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisCacheService } from "../redis/redis-cache.service";

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService,
    private readonly cache: RedisCacheService
  ) {}

  async create(slug: string, dto: CreateCommentDto) {
    const game = await this.gamesService.findIdBySlug(slug);
    const comment = await this.prisma.gameComment.create({
      data: {
        gameId: game.id,
        userId: dto.userId,
        parentId: dto.parentId,
        bodyMd: dto.bodyMd
      }
    });

    await this.gamesService.invalidateGameCaches(slug);
    return comment;
  }

  async list(slug: string) {
    const cacheKey = `games:comments:${slug}`;
    const cached = await this.cache.getJson(cacheKey);
    if (cached) return cached;

    const game = await this.gamesService.findIdBySlug(slug);
    const comments = await this.prisma.gameComment.findMany({
      where: { gameId: game.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    await this.cache.setJson(cacheKey, comments, 60);
    return comments;
  }
}
