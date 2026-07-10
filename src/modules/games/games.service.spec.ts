import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { GamesService } from "./games.service";
import { Difficulty, GameStatus, RequirementType } from "./domain/game.enums";

const material = (slug: string) => ({
  materialId: slug,
  requirementType: RequirementType.Required,
  quantity: 1,
  notes: null,
  material: {
    id: slug,
    slug,
    name: slug,
    kind: slug
  }
});

const game = (slug: string, ratingAverage: number, materials: ReturnType<typeof material>[], createdAt: Date) => ({
  id: slug,
  slug,
  title: slug,
  summaryMd: `${slug} summary`,
  rulesMd: `${slug} rules`,
  minPlayers: 2,
  maxPlayers: 4,
  minAge: 8,
  difficulty: Difficulty.Easy,
  durationMinutes: 20,
  indoor: true,
  outdoor: false,
  status: GameStatus.Approved,
  ratingAverage,
  ratingCount: 1,
  createdAt,
  updatedAt: createdAt,
  deletedAt: null,
  rulesSourceUrl: null,
  externalSource: null,
  externalId: null,
  createdById: null,
  materials,
  categories: [],
  assets: [],
  ratings: []
});

describe("GamesService.query", () => {
  it("filters material searches before sorting and paginating", async () => {
    let countArgs: unknown;
    let findManyArgs: Record<string, unknown> | undefined;
    const games = [
      game("paper-only", 5, [material("paper")], new Date("2026-01-02T00:00:00.000Z")),
      game("paper-and-pen", 4, [material("paper"), material("pen")], new Date("2026-01-01T00:00:00.000Z")),
      game("pen-only", 3, [material("pen")], new Date("2026-01-03T00:00:00.000Z"))
    ];
    const prisma = {
      game: {
        count: (args: unknown) => {
          countArgs = args;
          return Promise.resolve(games.length);
        },
        findMany: (args: Record<string, unknown>) => {
          findManyArgs = args;
          return Promise.resolve(games);
        }
      },
      $transaction: (operations: Promise<unknown>[]) => Promise.all(operations)
    };
    const service = new GamesService(prisma as never, {} as never);

    const response = await service.query({ materialSlugs: ["paper", "pen"], page: 1, limit: 2 });

    assert.deepEqual(response.items.map((item) => item.slug), ["paper-and-pen", "paper-only"]);
    assert.equal(response.total, 3);
    assert.equal(response.hasNextPage, true);
    assert.equal(findManyArgs?.skip, undefined);
    assert.equal(findManyArgs?.take, undefined);
    assert.match(JSON.stringify(countArgs), /"materials"/);
    assert.match(JSON.stringify(countArgs), /"paper"/);
    assert.match(JSON.stringify(countArgs), /"pen"/);
  });

  it("ranks fully playable material matches before games that require extra materials", async () => {
    const games = [
      game(
        "matches-three-but-needs-more",
        5,
        [material("paper"), material("pen"), material("timer"), material("dice")],
        new Date("2026-01-03T00:00:00.000Z")
      ),
      game(
        "fully-playable-three",
        3,
        [material("paper"), material("pen"), material("timer")],
        new Date("2026-01-01T00:00:00.000Z")
      ),
      game("fully-playable-two", 4, [material("paper"), material("pen")], new Date("2026-01-02T00:00:00.000Z"))
    ];
    const prisma = {
      game: {
        count: () => Promise.resolve(games.length),
        findMany: () => Promise.resolve(games)
      },
      $transaction: (operations: Promise<unknown>[]) => Promise.all(operations)
    };
    const service = new GamesService(prisma as never, {} as never);

    const response = await service.query({ materialSlugs: ["paper", "pen", "timer"], page: 1, limit: 3 });

    assert.deepEqual(response.items.map((item) => item.slug), [
      "fully-playable-three",
      "fully-playable-two",
      "matches-three-but-needs-more"
    ]);
  });
});
