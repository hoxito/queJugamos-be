import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { RateGameDto } from "../games/dto/rate-game.dto";
import { GamesService } from "../games/games.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService
  ) {}

  async rate(slug: string, dto: RateGameDto) {
    const game = await this.gamesService.findIdBySlug(slug);

    await this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.gameRating.findFirst({
        where: {
          gameId: game.id,
          userId: dto.userId,
          deletedAt: null
        }
      });

      if (existing) {
        await prisma.gameRating.update({
          where: { id: existing.id },
          data: {
            value: dto.value,
            comment: dto.comment
          }
        });
      } else {
        await prisma.gameRating.create({
          data: {
            gameId: game.id,
            userId: dto.userId,
            value: dto.value,
            comment: dto.comment
          }
        });
      }

      const aggregate = await prisma.gameRating.aggregate({
        where: { gameId: game.id, deletedAt: null },
        _avg: { value: true },
        _count: { id: true }
      });

      await prisma.game.update({
        where: { id: game.id },
        data: {
          ratingAverage: new Prisma.Decimal((aggregate._avg.value ?? 0).toFixed(2)),
          ratingCount: aggregate._count.id
        }
      });
    });

    await this.gamesService.invalidateGameCaches(slug);
    return this.gamesService.findBySlug(slug);
  }
}
