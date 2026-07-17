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
  ratings: [],
  comments: [],
  cardAdaptations: []
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

describe("GamesService.filters", () => {
  it("returns safe defaults when there are no approved games", async () => {
    const prisma = {
      material: {
        findMany: () =>
          Promise.resolve([
            {
              slug: "paper",
              name: "Paper",
              kind: "paper"
            }
          ])
      },
      category: {
        findMany: () =>
          Promise.resolve([
            {
              slug: "quick-play",
              name: "Quick Play"
            }
          ])
      },
      game: {
        aggregate: () =>
          Promise.resolve({
            _min: { minPlayers: null, minAge: null },
            _max: { maxPlayers: null, minAge: null }
          })
      },
      $transaction: (operations: Promise<unknown>[]) => Promise.all(operations)
    };
    const service = new GamesService(prisma as never, {} as never);

    const response = await service.filters();

    assert.deepEqual(response, {
      categories: [{ slug: "quick-play", name: "Quick Play" }],
      materials: [
        {
          slug: "paper",
          name: "Paper",
          kind: "paper",
          requirementType: RequirementType.Required,
          quantity: null,
          notes: null
        }
      ],
      difficulties: ["easy", "medium", "hard"],
      minPlayers: 1,
      maxPlayers: 1,
      minAge: 0,
      maxAge: 0
    });
  });
});

describe("GamesService.findBySlug", () => {
  it("only returns approved games from the public detail lookup", async () => {
    let findFirstArgs: Record<string, unknown> | undefined;
    const prisma = {
      game: {
        findFirst: (args: Record<string, unknown>) => {
          findFirstArgs = args;
          return Promise.resolve(game("just-one", 4.5, [material("cards")], new Date("2026-01-01T00:00:00.000Z")));
        }
      }
    };
    const service = new GamesService(prisma as never, {} as never);

    const response = await service.findBySlug("just-one");

    assert.equal(response.slug, "just-one");
    assert.deepEqual(findFirstArgs?.where, {
      slug: "just-one",
      deletedAt: null,
      status: GameStatus.Approved
    });
  });

  it("allows moderation detail lookup without forcing approved status", async () => {
    let findFirstArgs: Record<string, unknown> | undefined;
    const pendingGame = {
      ...game("werewolf", 4.2, [material("cards")], new Date("2026-01-01T00:00:00.000Z")),
      status: GameStatus.Pending
    };
    const prisma = {
      game: {
        findFirst: (args: Record<string, unknown>) => {
          findFirstArgs = args;
          return Promise.resolve(pendingGame);
        }
      }
    };
    const service = new GamesService(prisma as never, {} as never);

    const response = await service.findForModeration("werewolf");

    assert.equal(response.status, GameStatus.Pending);
    assert.deepEqual(findFirstArgs?.where, {
      slug: "werewolf",
      deletedAt: null
    });
  });
});
