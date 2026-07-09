import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { paginatedResponse, resolvePageOptions } from "../../common/pagination/pagination";
import { toSlug } from "../../common/slug";
import { PrismaService } from "../prisma/prisma.service";
import { RedisCacheService } from "../redis/redis-cache.service";
import { CreateGameDto } from "./dto/create-game.dto";
import { ModerateGameDto } from "./dto/moderate-game.dto";
import { QueryGamesDto } from "./dto/query-games.dto";
import { UpdateGameDto } from "./dto/update-game.dto";
import { GameStatus, RequirementType } from "./domain/game.enums";

const gameInclude = {
  materials: { include: { material: true } },
  categories: { include: { category: true } },
  cardAdaptations: { include: { mappings: true } },
  assets: true,
  ratings: true,
  comments: true
} satisfies Prisma.GameInclude;

const catalogInclude = {
  materials: { include: { material: true } },
  categories: { include: { category: true } },
  assets: true,
  ratings: true
} satisfies Prisma.GameInclude;

type GameCatalogRecord = Prisma.GameGetPayload<{ include: typeof catalogInclude }>;
type GameDetailRecord = Prisma.GameGetPayload<{ include: typeof gameInclude }>;

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService
  ) {}

  async create(dto: CreateGameDto) {
    const slug = dto.slug ? toSlug(dto.slug) : toSlug(dto.title);
    const materialIds = dto.materials.map((material) => material.materialId);
    const existingMaterials = await this.prisma.material.count({
      where: { id: { in: materialIds }, deletedAt: null }
    });

    if (existingMaterials !== materialIds.length) {
      throw new NotFoundException("One or more materials do not exist.");
    }

    const categoryIds = dto.categoryIds ?? [];
    const existingCategories =
      categoryIds.length > 0
        ? await this.prisma.category.count({ where: { id: { in: categoryIds }, deletedAt: null } })
        : 0;

    if (existingCategories !== categoryIds.length) {
      throw new NotFoundException("One or more categories do not exist.");
    }

    const game = await this.prisma.game.create({
      data: {
        title: dto.title,
        slug,
        summaryMd: dto.summaryMd,
        rulesMd: dto.rulesMd,
        rulesSourceUrl: dto.rulesSourceUrl,
        externalSource: dto.externalSource,
        externalId: dto.externalId,
        minPlayers: dto.minPlayers,
        maxPlayers: dto.maxPlayers,
        minAge: dto.minAge,
        difficulty: dto.difficulty,
        durationMinutes: dto.durationMinutes,
        indoor: dto.indoor,
        outdoor: dto.outdoor,
        status: dto.status ?? GameStatus.Pending,
        materials: {
          create: dto.materials.map((item) => ({
            materialId: item.materialId,
            requirementType: item.requirementType,
            quantity: item.quantity,
            notes: item.notes
          }))
        },
        categories:
          categoryIds.length > 0
            ? {
                create: categoryIds.map((categoryId) => ({ categoryId }))
              }
            : undefined,
        assets: dto.assets?.length
          ? {
              create: dto.assets.map((asset) => ({
                kind: asset.kind,
                sourceType: asset.sourceType,
                publicUrl: asset.publicUrl,
                sourceUrl: asset.sourceUrl,
                credit: asset.credit,
                licenseLabel: asset.licenseLabel,
                storageProvider: asset.storageProvider,
                bucket: asset.bucket,
                objectKey: asset.objectKey,
                contentType: asset.contentType,
                altText: asset.altText,
                sortOrder: asset.sortOrder ?? 0
              }))
            }
          : undefined,
        cardAdaptations: dto.cardAdaptations?.length
          ? {
              create: dto.cardAdaptations.map((adaptation) => ({
                deckType: adaptation.deckType,
                uniqueCardsNeeded: adaptation.uniqueCardsNeeded,
                totalCardsNeeded: adaptation.totalCardsNeeded,
                notes: adaptation.notes,
                mappings: {
                  create: adaptation.mappings.map((mapping) => ({
                    sourceCard: mapping.sourceCard,
                    meaning: mapping.meaning,
                    quantity: mapping.quantity
                  }))
                }
              }))
            }
          : undefined
      }
    });

    await this.invalidateGameCaches(game.slug);
    return this.findBySlug(game.slug);
  }

  async update(slug: string, dto: UpdateGameDto) {
    const existingGame = await this.findIdBySlug(slug);
    const nextSlug = dto.slug ? toSlug(dto.slug) : undefined;

    if (dto.materials) {
      const materialIds = dto.materials.map((material) => material.materialId);
      const existingMaterials = await this.prisma.material.count({
        where: { id: { in: materialIds }, deletedAt: null }
      });
      if (existingMaterials !== materialIds.length) {
        throw new NotFoundException("One or more materials do not exist.");
      }
    }

    if (dto.categoryIds) {
      const existingCategories = await this.prisma.category.count({
        where: { id: { in: dto.categoryIds }, deletedAt: null }
      });
      if (existingCategories !== dto.categoryIds.length) {
        throw new NotFoundException("One or more categories do not exist.");
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.game.update({
        where: { id: existingGame.id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
          ...(dto.summaryMd !== undefined ? { summaryMd: dto.summaryMd } : {}),
          ...(dto.rulesMd !== undefined ? { rulesMd: dto.rulesMd } : {}),
          ...(dto.rulesSourceUrl !== undefined ? { rulesSourceUrl: dto.rulesSourceUrl } : {}),
          ...(dto.externalSource !== undefined ? { externalSource: dto.externalSource } : {}),
          ...(dto.externalId !== undefined ? { externalId: dto.externalId } : {}),
          ...(dto.minPlayers !== undefined ? { minPlayers: dto.minPlayers } : {}),
          ...(dto.maxPlayers !== undefined ? { maxPlayers: dto.maxPlayers } : {}),
          ...(dto.minAge !== undefined ? { minAge: dto.minAge } : {}),
          ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
          ...(dto.durationMinutes !== undefined ? { durationMinutes: dto.durationMinutes } : {}),
          ...(dto.indoor !== undefined ? { indoor: dto.indoor } : {}),
          ...(dto.outdoor !== undefined ? { outdoor: dto.outdoor } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {})
        }
      });

      if (dto.materials) {
        await tx.gameMaterial.deleteMany({ where: { gameId: existingGame.id } });
        await tx.gameMaterial.createMany({
          data: dto.materials.map((item) => ({
            gameId: existingGame.id,
            materialId: item.materialId,
            requirementType: item.requirementType,
            quantity: item.quantity,
            notes: item.notes
          }))
        });
      }

      if (dto.categoryIds) {
        await tx.gameCategory.deleteMany({ where: { gameId: existingGame.id } });
        if (dto.categoryIds.length > 0) {
          await tx.gameCategory.createMany({
            data: dto.categoryIds.map((categoryId) => ({ gameId: existingGame.id, categoryId }))
          });
        }
      }

      if (dto.assets) {
        await tx.gameAsset.deleteMany({ where: { gameId: existingGame.id } });
        if (dto.assets.length > 0) {
          await tx.gameAsset.createMany({
            data: dto.assets.map((asset) => ({
              gameId: existingGame.id,
              kind: asset.kind,
              sourceType: asset.sourceType,
              publicUrl: asset.publicUrl,
              sourceUrl: asset.sourceUrl,
              credit: asset.credit,
              licenseLabel: asset.licenseLabel,
              storageProvider: asset.storageProvider,
              bucket: asset.bucket,
              objectKey: asset.objectKey,
              contentType: asset.contentType,
              altText: asset.altText,
              sortOrder: asset.sortOrder ?? 0
            }))
          });
        }
      }

      if (dto.cardAdaptations) {
        await tx.cardAdaptation.deleteMany({ where: { gameId: existingGame.id } });
        for (const adaptation of dto.cardAdaptations) {
          await tx.cardAdaptation.create({
            data: {
              gameId: existingGame.id,
              deckType: adaptation.deckType,
              uniqueCardsNeeded: adaptation.uniqueCardsNeeded,
              totalCardsNeeded: adaptation.totalCardsNeeded,
              notes: adaptation.notes,
              mappings: {
                create: adaptation.mappings.map((mapping) => ({
                  sourceCard: mapping.sourceCard,
                  meaning: mapping.meaning,
                  quantity: mapping.quantity
                }))
              }
            }
          });
        }
      }
    });

    await this.invalidateGameCaches(slug);
    if (nextSlug && nextSlug !== slug) await this.invalidateGameCaches(nextSlug);
    return this.findBySlug(nextSlug ?? slug);
  }

  async query(filters: QueryGamesDto) {
    return this.queryByStatus(filters, GameStatus.Approved);
  }

  async moderationQueue(filters: QueryGamesDto) {
    return this.queryByStatus(filters, GameStatus.Pending);
  }

  async filters() {
    const [materials, categories, aggregate] = await this.prisma.$transaction([
      this.prisma.material.findMany({
        where: { deletedAt: null },
        orderBy: [{ kind: "asc" }, { name: "asc" }]
      }),
      this.prisma.category.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" }
      }),
      this.prisma.game.aggregate({
        where: { status: GameStatus.Approved, deletedAt: null },
        _min: { minPlayers: true, minAge: true },
        _max: { maxPlayers: true, minAge: true }
      })
    ]);

    return {
      categories: categories.map((category) => ({
        slug: category.slug,
        name: category.name
      })),
      materials: materials.map((material) => ({
        slug: material.slug,
        name: material.name,
        kind: material.kind,
        requirementType: RequirementType.Required,
        quantity: null,
        notes: null
      })),
      difficulties: ["easy", "medium", "hard"],
      minPlayers: aggregate._min.minPlayers ?? 1,
      maxPlayers: aggregate._max.maxPlayers ?? 1,
      minAge: aggregate._min.minAge ?? 0,
      maxAge: aggregate._max.minAge ?? 0
    };
  }

  async moderate(slug: string, dto: ModerateGameDto) {
    const existingGame = await this.findIdBySlug(slug);
    await this.prisma.game.update({
      where: { id: existingGame.id },
      data: { status: dto.status }
    });
    await this.invalidateGameCaches(slug);
    return this.findBySlug(slug);
  }

  private async queryByStatus(filters: QueryGamesDto, status: GameStatus) {
    const materialIds = filters.materialIds ?? [];
    const materialSlugs = filters.materialSlugs ?? [];
    const pageOptions = resolvePageOptions(filters);
    const where: Prisma.GameWhereInput = {
      status,
      deletedAt: null,
      ...(filters.query
        ? {
            OR: [
              { title: { contains: filters.query, mode: "insensitive" } },
              { summaryMd: { contains: filters.query, mode: "insensitive" } },
              { rulesMd: { contains: filters.query, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(filters.players ? { minPlayers: { lte: filters.players }, maxPlayers: { gte: filters.players } } : {}),
      ...(filters.maxAge ? { minAge: { lte: filters.maxAge } } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      ...(filters.outdoorOnly ? { outdoor: true } : {})
    };

    const [total, games] = await this.prisma.$transaction([
      this.prisma.game.count({ where }),
      this.prisma.game.findMany({
        where,
        include: catalogInclude,
        orderBy: [{ ratingAverage: "desc" }, { createdAt: "desc" }],
        skip: materialIds.length > 0 || materialSlugs.length > 0 ? 0 : pageOptions.skip,
        take:
          materialIds.length > 0 || materialSlugs.length > 0
            ? Math.max(100, pageOptions.skip + pageOptions.limit)
            : pageOptions.limit
      })
    ]);

    const sortedGames =
      materialIds.length > 0 || materialSlugs.length > 0
        ? games
            .map((game) => ({
              game,
              matchingMaterialCount: game.materials.filter(
                (gameMaterial) =>
                  gameMaterial.requirementType === RequirementType.Required &&
                  (materialIds.includes(gameMaterial.materialId) || materialSlugs.includes(gameMaterial.material.slug))
              ).length
            }))
            .sort((left, right) => {
              if (right.matchingMaterialCount !== left.matchingMaterialCount) {
                return right.matchingMaterialCount - left.matchingMaterialCount;
              }
              return Number(right.game.ratingAverage) - Number(left.game.ratingAverage);
            })
            .slice(pageOptions.skip, pageOptions.skip + pageOptions.limit)
            .map(({ game }) => game)
        : games;

    return paginatedResponse(sortedGames.map(mapCatalogGame), total, pageOptions);
  }

  async findBySlug(slug: string) {
    const game = await this.prisma.game.findFirst({
      where: { slug, deletedAt: null },
      include: gameInclude
    });

    if (!game) {
      throw new NotFoundException("Game not found.");
    }

    const response = mapDetailGame(game);
    return response;
  }

  async findIdBySlug(slug: string) {
    const game = await this.prisma.game.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, slug: true }
    });

    if (!game) {
      throw new NotFoundException("Game not found.");
    }

    return game;
  }

  async invalidateGameCaches(slug?: string) {
    await this.cache.deleteByPattern("games:query:*");
    await this.cache.deleteByPattern("games:filters:*");
    await this.cache.deleteByPattern("games:detail:*");
    if (slug) {
      await this.cache.del(`games:comments:${slug}`);
    }
  }
}

function mapCatalogGame(game: GameCatalogRecord) {
  const images = mapAssets(game.assets).filter((asset) => asset.kind === "cover" || asset.kind === "image");
  return {
    slug: game.slug,
    title: game.title,
    summaryMd: game.summaryMd,
    ratingAverage: Number(game.ratingAverage),
    ratingCount: game.ratingCount,
    coverImage: images[0] ?? null,
    categories: game.categories.map((item) => ({
      slug: item.category.slug,
      name: item.category.name
    })),
    materials: game.materials.map((item) => ({
      slug: item.material.slug,
      name: item.material.name,
      kind: item.material.kind,
      requirementType: item.requirementType,
      quantity: item.quantity,
      notes: item.notes
    })),
    ratings: mapPublicRatings(game.ratings),
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    minAge: game.minAge,
    difficulty: game.difficulty,
    durationMinutes: game.durationMinutes
  };
}

function mapDetailGame(game: GameDetailRecord) {
  const assets = mapAssets(game.assets);
  const imageAssets = assets.filter((asset) => asset.kind === "cover" || asset.kind === "image");
  const downloadableAssets = assets.filter((asset) => asset.kind === "printable" || asset.kind === "rules_pdf");
  const referenceLinks = assets.filter((asset) => asset.kind === "other");

  return {
    ...mapCatalogGame(game),
    rulesMd: game.rulesMd,
    galleryImages: imageAssets,
    downloadableAssets,
    referenceLinks,
    ratings: game.ratings
      ? mapPublicRatings(game.ratings)
      : []
  };
}

function mapPublicRatings(ratings: GameCatalogRecord["ratings"]) {
  return ratings
    .filter((rating) => !rating.deletedAt)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .map((rating) => ({
      value: rating.value,
      comment: rating.comment
    }));
}

function mapAssets(assets: GameCatalogRecord["assets"]) {
  return assets
    .filter((asset) => !asset.deletedAt)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((asset) => ({
      kind: asset.kind,
      sourceType: asset.sourceType,
      url: asset.publicUrl ?? asset.sourceUrl ?? "",
      sourceUrl: asset.sourceUrl,
      credit: asset.credit,
      licenseLabel: asset.licenseLabel,
      altText: asset.altText
    }))
    .filter((asset) => asset.url.length > 0);
}
