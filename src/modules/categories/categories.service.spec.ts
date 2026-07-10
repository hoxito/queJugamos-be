import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { CategoriesService } from "./categories.service";

describe("CategoriesService.create", () => {
  it("idempotently upserts categories by slug", async () => {
    let upsertArgs: unknown;
    let cacheKey: string | undefined;
    const prisma = {
      category: {
        upsert: (args: unknown) => {
          upsertArgs = args;
          return Promise.resolve({ slug: "quick-play" });
        }
      }
    };
    const cache = { del: (key: string) => (cacheKey = key) };
    const service = new CategoriesService(prisma as never, cache as never);

    await service.create({ name: "Quick Play" });

    assert.deepEqual(upsertArgs, {
      where: { slug: "quick-play" },
      update: { name: "Quick Play" },
      create: { name: "Quick Play", slug: "quick-play" }
    });
    assert.equal(cacheKey, "categories:list");
  });
});
