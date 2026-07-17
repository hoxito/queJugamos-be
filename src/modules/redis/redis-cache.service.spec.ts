import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RedisCacheService } from "./redis-cache.service";

function redisStub(overrides: Record<string, unknown>) {
  return {
    status: "ready",
    get: () => Promise.resolve(null),
    set: () => Promise.resolve("OK"),
    del: () => Promise.resolve(1),
    scan: () => Promise.resolve(["0", []]),
    zadd: () => Promise.resolve(1),
    zcard: () => Promise.resolve(0),
    zrange: () => Promise.resolve([]),
    zrem: () => Promise.resolve(0),
    connect: () => Promise.resolve(),
    ...overrides
  };
}

describe("RedisCacheService", () => {
  it("treats invalid cached JSON as a cache miss and deletes the bad key", async () => {
    const deletedKeys: string[] = [];
    const service = new RedisCacheService(
      redisStub({
        get: () => Promise.resolve("{not-json"),
        del: (...keys: string[]) => {
          deletedKeys.push(...keys);
          return Promise.resolve(keys.length);
        }
      }) as never
    );

    const value = await service.getJson("games:filters:bad");

    assert.equal(value, null);
    assert.deepEqual(deletedKeys, ["games:filters:bad"]);
  });

  it("treats Redis connection failures as cache misses", async () => {
    const service = new RedisCacheService(
      redisStub({
        status: "wait",
        connect: () => Promise.reject(new Error("Redis unavailable"))
      }) as never
    );

    await assert.doesNotReject(() => service.getJson("games:filters:any"));
    assert.equal(await service.getJson("games:filters:any"), null);
  });

  it("does not throw when pattern deletion scan fails", async () => {
    const service = new RedisCacheService(
      redisStub({
        scan: () => Promise.reject(new Error("scan failed"))
      }) as never
    );

    await assert.doesNotReject(() => service.deleteByPattern("games:filters:*"));
  });
});
