import { SetMetadata } from "@nestjs/common";

export const REDIS_CACHED_OPTIONS = "redis_cached_options";

export type RedisCachedOptions = {
  namespace: string;
  ttlSeconds: number;
  ttlSecondsEnv?: string;
  maxEntriesEnv?: string;
  maxEntriesDefault?: number;
};

export const RedisCached = (options: RedisCachedOptions) => SetMetadata(REDIS_CACHED_OPTIONS, options);
