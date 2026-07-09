import { Inject, Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.command(() => this.redis.get(key));
    return value ? (JSON.parse(value) as T) : null;
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.command(() => this.redis.set(key, JSON.stringify(value, jsonReplacer), "EX", ttlSeconds));
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.command(() => this.redis.del(...keys));
  }

  async deleteByPattern(pattern: string): Promise<void> {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.command(() => this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100));
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.del(...keys);
      }
    } while (cursor !== "0");
  }

  async trackKey(namespace: string, key: string, maxEntries: number): Promise<void> {
    const indexKey = `${namespace}:keys`;
    await this.command(async () => {
      await this.redis.zadd(indexKey, Date.now(), key);
      const overflow = await this.redis.zcard(indexKey);
      if (overflow <= maxEntries) return null;
      const keys = await this.redis.zrange(indexKey, 0, overflow - maxEntries - 1);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.zrem(indexKey, ...keys);
      }
      return null;
    });
  }

  private async command<T>(operation: () => Promise<T>): Promise<T> {
    if (this.redis.status === "wait") {
      await this.redis.connect();
    }

    try {
      return await operation();
    } catch (error) {
      this.logger.warn(`Redis cache command failed: ${(error as Error).message}`);
      return null as T;
    }
  }
}

function jsonReplacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value;
}
