import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { MaterialKind } from "../games/domain/game.enums";
import { MaterialsService } from "./materials.service";

describe("MaterialsService.create", () => {
  it("idempotently upserts materials by slug", async () => {
    let upsertArgs: unknown;
    let cacheKey: string | undefined;
    const prisma = {
      material: {
        upsert: (args: unknown) => {
          upsertArgs = args;
          return Promise.resolve({ slug: "paper" });
        }
      }
    };
    const cache = { del: (key: string) => (cacheKey = key) };
    const service = new MaterialsService(prisma as never, cache as never);

    await service.create({ name: "Paper", kind: MaterialKind.Paper, aliases: ["sheet"] });

    assert.deepEqual(upsertArgs, {
      where: { slug: "paper" },
      update: { name: "Paper", kind: MaterialKind.Paper, aliases: ["sheet"] },
      create: { name: "Paper", slug: "paper", kind: MaterialKind.Paper, aliases: ["sheet"] }
    });
    assert.equal(cacheKey, "materials:list");
  });
});
