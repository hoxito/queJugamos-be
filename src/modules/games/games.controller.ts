import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { RedisCached } from "../../common/cache/redis-cached.decorator";
import { AuthGuard } from "../auth/auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../users/domain/user-role.enum";
import { CreateGameDto } from "./dto/create-game.dto";
import { GameDetailDto, GameFiltersDto, PaginatedGamesDto } from "./dto/game-response.dto";
import { ModerateGameDto } from "./dto/moderate-game.dto";
import { QueryGamesDto } from "./dto/query-games.dto";
import { UpdateGameDto } from "./dto/update-game.dto";
import { GamesService } from "./games.service";

@ApiTags("games")
@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedGamesDto })
  @RedisCached({
    namespace: "games:query",
    ttlSeconds: 60,
    ttlSecondsEnv: "GAMES_QUERY_CACHE_TTL_SECONDS",
    maxEntriesEnv: "GAMES_QUERY_CACHE_MAX_ENTRIES",
    maxEntriesDefault: 200
  })
  list(@Query() filters: QueryGamesDto) {
    return this.gamesService.query(filters);
  }

  @Post("query")
  @ApiOkResponse({ type: PaginatedGamesDto })
  @RedisCached({
    namespace: "games:query",
    ttlSeconds: 60,
    ttlSecondsEnv: "GAMES_QUERY_CACHE_TTL_SECONDS",
    maxEntriesEnv: "GAMES_QUERY_CACHE_MAX_ENTRIES",
    maxEntriesDefault: 200
  })
  query(@Body() filters: QueryGamesDto) {
    return this.gamesService.query(filters);
  }

  @Get("filters")
  @ApiOkResponse({ type: GameFiltersDto })
  @RedisCached({
    namespace: "games:filters",
    ttlSeconds: 300,
    ttlSecondsEnv: "GAMES_FILTERS_CACHE_TTL_SECONDS",
    maxEntriesEnv: "GAMES_FILTERS_CACHE_MAX_ENTRIES",
    maxEntriesDefault: 20
  })
  filters() {
    return this.gamesService.filters();
  }

  @Get("moderation/pending")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Reviewer, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PaginatedGamesDto })
  moderationQueue(@Query() filters: QueryGamesDto) {
    return this.gamesService.moderationQueue(filters);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  create(@Body() dto: CreateGameDto) {
    return this.gamesService.create(dto);
  }

  @Patch(":slug")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  update(@Param("slug") slug: string, @Body() dto: UpdateGameDto) {
    return this.gamesService.update(slug, dto);
  }

  @Patch(":slug/moderation")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Reviewer, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOkResponse({ type: GameDetailDto })
  moderate(@Param("slug") slug: string, @Body() dto: ModerateGameDto) {
    return this.gamesService.moderate(slug, dto);
  }

  @Get("moderation/:slug")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Reviewer, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOkResponse({ type: GameDetailDto })
  findForModeration(@Param("slug") slug: string) {
    return this.gamesService.findForModeration(slug);
  }

  @Get(":slug")
  @ApiOkResponse({ type: GameDetailDto })
  @RedisCached({
    namespace: "games:detail",
    ttlSeconds: 120,
    ttlSecondsEnv: "GAMES_DETAIL_CACHE_TTL_SECONDS",
    maxEntriesEnv: "GAMES_DETAIL_CACHE_MAX_ENTRIES",
    maxEntriesDefault: 500
  })
  findBySlug(@Param("slug") slug: string) {
    return this.gamesService.findBySlug(slug);
  }
}
