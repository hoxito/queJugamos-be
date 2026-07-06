import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthModule } from "./health/health.module";
import { GamesModule } from "./modules/games/games.module";
import { RedisModule } from "./modules/redis/redis.module";

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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("DATABASE_HOST", "localhost"),
        port: config.get<number>("DATABASE_PORT", 5432),
        username: config.get<string>("DATABASE_USER", "quejugamos"),
        password: config.get<string>("DATABASE_PASSWORD", "quejugamos"),
        database: config.get<string>("DATABASE_NAME", "quejugamos"),
        autoLoadEntities: true,
        synchronize: config.get<string>("NODE_ENV", "development") === "development",
        ssl: config.get<string>("DATABASE_SSL", "false") === "true" ? { rejectUnauthorized: false } : false
      })
    }),
    RedisModule,
    HealthModule,
    GamesModule
  ]
})
export class AppModule {}
