import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { RedisCacheInterceptor } from "./common/cache/redis-cache.interceptor";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { GamesModule } from "./modules/games/games.module";
import { MaterialsModule } from "./modules/materials/materials.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { RatingsModule } from "./modules/ratings/ratings.module";
import { RedisModule } from "./modules/redis/redis.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local"]
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 30_000
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    HealthModule,
    MaterialsModule,
    CategoriesModule,
    UsersModule,
    RatingsModule,
    CommentsModule,
    GamesModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RedisCacheInterceptor
    }
  ]
})
export class AppModule {}
