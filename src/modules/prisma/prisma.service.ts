import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: buildDatabaseUrl(config)
        }
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function buildDatabaseUrl(config: ConfigService): string {
  const directUrl = config.get<string>("DATABASE_URL");
  if (directUrl) return directUrl;

  const host = config.get<string>("DATABASE_HOST", "localhost");
  const port = config.get<number>("DATABASE_PORT", 5432);
  const user = config.get<string>("DATABASE_USER", "quejugamos");
  const password = config.get<string>("DATABASE_PASSWORD", "quejugamos");
  const database = config.get<string>("DATABASE_NAME", "quejugamos");
  const ssl = config.get<string>("DATABASE_SSL", "false") === "true" ? "?sslmode=require" : "";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}${ssl}`;
}
