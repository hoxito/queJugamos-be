import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { toSlug } from "../../common/slug";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CreateGameDto } from "./dto/create-game.dto";
import { QueryGamesDto } from "./dto/query-games.dto";
import { RateGameDto } from "./dto/rate-game.dto";
import { GameStatus, RequirementType } from "./domain/game.enums";
import { CardAdaptationEntity } from "./entities/card-adaptation.entity";
import { CategoryEntity } from "./entities/category.entity";
import { GameAssetEntity } from "./entities/game-asset.entity";
import { GameCategoryEntity } from "./entities/game-category.entity";
import { GameCommentEntity } from "./entities/game-comment.entity";
import { GameMaterialEntity } from "./entities/game-material.entity";
import { GameRatingEntity } from "./entities/game-rating.entity";
import { GameEntity } from "./entities/game.entity";
import { MaterialEntity } from "./entities/material.entity";

@Injectable()
export class GamesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(GameEntity)
    private readonly games: Repository<GameEntity>,
    @InjectRepository(MaterialEntity)
    private readonly materials: Repository<MaterialEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(GameRatingEntity)
    private readonly ratings: Repository<GameRatingEntity>,
    @InjectRepository(GameCommentEntity)
    private readonly comments: Repository<GameCommentEntity>
  ) {}

  async create(dto: CreateGameDto) {
    const slug = dto.slug ? toSlug(dto.slug) : toSlug(dto.title);
    const materialIds = dto.materials.map((material) => material.materialId);
    const existingMaterials = await this.materials.findBy({ id: In(materialIds) });

    if (existingMaterials.length !== materialIds.length) {
      throw new NotFoundException("One or more materials do not exist.");
    }

    const categoryIds = dto.categoryIds ?? [];
    const existingCategories = categoryIds.length > 0 ? await this.categories.findBy({ id: In(categoryIds) }) : [];

    return this.dataSource.transaction(async (manager) => {
      const game = manager.create(GameEntity, {
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
        status: dto.status ?? GameStatus.Pending
      });
      const savedGame = await manager.save(game);

      const gameMaterials = dto.materials.map((item) =>
        manager.create(GameMaterialEntity, {
          gameId: savedGame.id,
          materialId: item.materialId,
          requirementType: item.requirementType,
          quantity: item.quantity,
          notes: item.notes
        })
      );
      await manager.save(gameMaterials);

      if (existingCategories.length > 0) {
        await manager.save(
          existingCategories.map((category) =>
            manager.create(GameCategoryEntity, {
              gameId: savedGame.id,
              categoryId: category.id
            })
          )
        );
      }

      if (dto.assets?.length) {
        await manager.save(
          dto.assets.map((asset) =>
            manager.create(GameAssetEntity, {
              gameId: savedGame.id,
              ...asset
            })
          )
        );
      }

      if (dto.cardAdaptations?.length) {
        await manager.save(
          dto.cardAdaptations.map((adaptation) =>
            manager.create(CardAdaptationEntity, {
              gameId: savedGame.id,
              ...adaptation
            })
          )
        );
      }

      return this.findBySlug(savedGame.slug);
    });
  }

  async query(filters: QueryGamesDto) {
    const materialIds = filters.materialIds ?? [];
    const materialSlugs = filters.materialSlugs ?? [];
    const limit = filters.limit ?? 30;

    const query = this.games
      .createQueryBuilder("game")
      .leftJoinAndSelect("game.materials", "gameMaterial")
      .leftJoinAndSelect("gameMaterial.material", "material")
      .leftJoinAndSelect("game.assets", "asset")
      .where("game.status = :status", { status: GameStatus.Approved })
      .andWhere("game.deleted_at IS NULL");

    if (filters.query) {
      query.andWhere("(game.title ILIKE :term OR game.summary_md ILIKE :term OR game.rules_md ILIKE :term)", {
        term: `%${filters.query}%`
      });
    }

    if (filters.players) {
      query.andWhere(":players BETWEEN game.min_players AND game.max_players", { players: filters.players });
    }

    if (filters.maxAge) {
      query.andWhere("game.min_age <= :maxAge", { maxAge: filters.maxAge });
    }

    if (filters.difficulty) {
      query.andWhere("game.difficulty = :difficulty", { difficulty: filters.difficulty });
    }

    if (filters.outdoorOnly) {
      query.andWhere("game.outdoor = true");
    }

    if (materialIds.length > 0 || materialSlugs.length > 0) {
      query
        .addSelect(
          `COUNT(DISTINCT CASE WHEN gameMaterial.requirement_type = :required AND (gameMaterial.material_id IN (:...materialIds) OR material.slug IN (:...materialSlugs)) THEN gameMaterial.material_id END)`,
          "matching_material_count"
        )
        .addSelect(
          `COUNT(DISTINCT CASE WHEN gameMaterial.requirement_type = :required THEN gameMaterial.material_id END)`,
          "required_material_count"
        )
        .setParameters({
          materialIds: materialIds.length > 0 ? materialIds : ["00000000-0000-0000-0000-000000000000"],
          materialSlugs: materialSlugs.length > 0 ? materialSlugs : ["__none__"],
          required: RequirementType.Required
        })
        .groupBy("game.id")
        .addGroupBy("gameMaterial.id")
        .addGroupBy("material.id")
        .addGroupBy("asset.id")
        .orderBy("matching_material_count", "DESC")
        .addOrderBy("game.rating_average", "DESC");
    } else {
      query.orderBy("game.rating_average", "DESC").addOrderBy("game.created_at", "DESC");
    }

    return query.take(limit).getMany();
  }

  async findBySlug(slug: string) {
    const game = await this.games.findOne({
      where: { slug },
      relations: {
        materials: { material: true },
        categories: { category: true },
        cardAdaptations: { mappings: true },
        assets: true,
        ratings: true,
        comments: true
      }
    });

    if (!game) {
      throw new NotFoundException("Game not found.");
    }

    return game;
  }

  async rate(slug: string, dto: RateGameDto) {
    const game = await this.findBySlug(slug);

    await this.dataSource.transaction(async (manager) => {
      const ratingRepository = manager.getRepository(GameRatingEntity);
      const existing = await ratingRepository.findOne({
        where: {
          gameId: game.id,
          userId: dto.userId
        }
      });

      await ratingRepository.save({
        ...(existing ?? {}),
        gameId: game.id,
        userId: dto.userId,
        value: dto.value,
        comment: dto.comment
      });

      const aggregate = await ratingRepository
        .createQueryBuilder("rating")
        .select("AVG(rating.value)", "average")
        .addSelect("COUNT(rating.id)", "count")
        .where("rating.game_id = :gameId", { gameId: game.id })
        .andWhere("rating.deleted_at IS NULL")
        .getRawOne<{ average: string; count: string }>();

      await manager.update(GameEntity, game.id, {
        ratingAverage: Number(aggregate?.average ?? 0).toFixed(2),
        ratingCount: Number(aggregate?.count ?? 0)
      });
    });

    return this.findBySlug(slug);
  }

  async comment(slug: string, dto: CreateCommentDto) {
    const game = await this.findBySlug(slug);
    const comment = this.comments.create({
      gameId: game.id,
      userId: dto.userId,
      parentId: dto.parentId,
      bodyMd: dto.bodyMd
    });

    return this.comments.save(comment);
  }

  async listComments(slug: string) {
    const game = await this.findBySlug(slug);
    return this.comments.find({
      where: { gameId: game.id },
      order: { createdAt: "DESC" },
      take: 100
    });
  }
}
