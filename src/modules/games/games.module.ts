import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CardAdaptationEntity } from "./entities/card-adaptation.entity";
import { CardMappingEntity } from "./entities/card-mapping.entity";
import { CategoryEntity } from "./entities/category.entity";
import { GameAssetEntity } from "./entities/game-asset.entity";
import { GameCategoryEntity } from "./entities/game-category.entity";
import { GameCommentEntity } from "./entities/game-comment.entity";
import { GameMaterialEntity } from "./entities/game-material.entity";
import { GameRatingEntity } from "./entities/game-rating.entity";
import { GameEntity } from "./entities/game.entity";
import { MaterialEntity } from "./entities/material.entity";
import { UserEntity } from "./entities/user.entity";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameEntity,
      MaterialEntity,
      CategoryEntity,
      GameMaterialEntity,
      GameCategoryEntity,
      CardAdaptationEntity,
      CardMappingEntity,
      GameAssetEntity,
      GameRatingEntity,
      GameCommentEntity,
      UserEntity
    ])
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService]
})
export class GamesModule {}
