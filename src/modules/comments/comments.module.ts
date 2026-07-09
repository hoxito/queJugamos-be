import { Module } from "@nestjs/common";
import { GamesModule } from "../games/games.module";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";

@Module({
  imports: [GamesModule],
  controllers: [CommentsController],
  providers: [CommentsService]
})
export class CommentsModule {}
