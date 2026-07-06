import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CreateGameDto } from "./dto/create-game.dto";
import { QueryGamesDto } from "./dto/query-games.dto";
import { RateGameDto } from "./dto/rate-game.dto";
import { GamesService } from "./games.service";

@ApiTags("games")
@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  list(@Query() filters: QueryGamesDto) {
    return this.gamesService.query(filters);
  }

  @Post("query")
  query(@Body() filters: QueryGamesDto) {
    return this.gamesService.query(filters);
  }

  @Post()
  create(@Body() dto: CreateGameDto) {
    return this.gamesService.create(dto);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.gamesService.findBySlug(slug);
  }

  @Post(":slug/ratings")
  rate(@Param("slug") slug: string, @Body() dto: RateGameDto) {
    return this.gamesService.rate(slug, dto);
  }

  @Get(":slug/comments")
  listComments(@Param("slug") slug: string) {
    return this.gamesService.listComments(slug);
  }

  @Post(":slug/comments")
  comment(@Param("slug") slug: string, @Body() dto: CreateCommentDto) {
    return this.gamesService.comment(slug, dto);
  }
}
