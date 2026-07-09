import { Module } from "@nestjs/common";
import { GamesModule } from "../games/games.module";
import { RatingsController } from "./ratings.controller";
import { RatingsService } from "./ratings.service";

@Module({
  imports: [GamesModule],
  controllers: [RatingsController],
  providers: [RatingsService]
})
export class RatingsModule {}
