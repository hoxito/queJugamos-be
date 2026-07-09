import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { createHash } from "node:crypto";
import { Observable, from, of, switchMap, tap } from "rxjs";
import { RedisCacheService } from "../../modules/redis/redis-cache.service";
import { REDIS_CACHED_OPTIONS, RedisCachedOptions } from "./redis-cached.decorator";

type CacheableRequest = {
  method: string;
  originalUrl?: string;
  url: string;
  query?: unknown;
  body?: unknown;
};

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: RedisCacheService,
    private readonly config: ConfigService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<RedisCachedOptions>(REDIS_CACHED_OPTIONS, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!options) return next.handle();

    const request = context.switchToHttp().getRequest<CacheableRequest>();
    const key = this.keyFor(options.namespace, request);

    return from(this.cache.getJson<unknown>(key)).pipe(
      switchMap((cached) => {
        if (cached) return of(cached);
        return next.handle().pipe(
          tap((response) => {
            void this.cache.setJson(key, response, this.ttlSeconds(options));
            void this.cache.trackKey(options.namespace, key, this.maxEntries(options));
          })
        );
      })
    );
  }

  private maxEntries(options: RedisCachedOptions) {
    if (!options.maxEntriesEnv) return options.maxEntriesDefault ?? 100;
    return this.config.get<number>(options.maxEntriesEnv, options.maxEntriesDefault ?? 100);
  }

  private ttlSeconds(options: RedisCachedOptions) {
    if (!options.ttlSecondsEnv) return options.ttlSeconds;
    return this.config.get<number>(options.ttlSecondsEnv, options.ttlSeconds);
  }

  private keyFor(namespace: string, request: CacheableRequest) {
    const payload = JSON.stringify({
      method: request.method,
      url: request.originalUrl ?? request.url,
      query: request.query ?? {},
      body: request.body ?? {}
    });
    const hash = createHash("sha256").update(payload).digest("hex");
    return `${namespace}:${hash}`;
  }
}
