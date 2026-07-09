import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RateGameDto } from "../games/dto/rate-game.dto";
import { RatingsService } from "./ratings.service";

@ApiTags("ratings")
@Controller("games/:slug/ratings")
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  rate(@Param("slug") slug: string, @Body() dto: RateGameDto) {
    return this.ratingsService.rate(slug, dto);
  }
}
