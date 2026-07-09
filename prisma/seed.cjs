const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const syntheticUsers = Array.from({ length: 20 }, (_, index) => ({
  id: `90000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
  email: `seed-player-${index + 1}@quejugamos.local`,
  displayName: `Seed Player ${index + 1}`,
  role: "player"
}));

const localGames = [
  {
    title: "Tateti",
    slug: "tateti",
    materials: ["paper", "pen"],
    rulesMd:
      "Players alternate marking X or O on a 3 by 3 grid. The first player to complete a row, column or diagonal wins.",
    minPlayers: 2,
    maxPlayers: 2,
    minAge: 5,
    difficulty: "easy",
    durationMinutes: 5,
    indoor: true,
    outdoor: true,
    ratingTarget: 3.8,
    categories: ["abstract", "quick-play", "kids"]
  },
  {
    title: "Tutifruti",
    slug: "tutifruti",
    materials: ["paper", "pen", "timer"],
    rulesMd:
      "Players choose categories and a starting letter, then write valid words before time runs out. Unique valid answers score points.",
    minPlayers: 2,
    maxPlayers: 12,
    minAge: 8,
    difficulty: "easy",
    durationMinutes: 20,
    indoor: true,
    outdoor: true,
    ratingTarget: 4.0,
    categories: ["party", "word", "quick-play"]
  }
];

const categoryNames = {
  abstract: "Abstract",
  area_control: "Area Control",
  bluffing: "Bluffing",
  cards: "Cards",
  classic: "Classic",
  cooperative: "Cooperative",
  deduction: "Deduction",
  dexterity: "Dexterity",
  dice: "Dice",
  economic: "Economic",
  family: "Family",
  fantasy: "Fantasy",
  gateway: "Gateway",
  kids: "Kids",
  legacy_campaign: "Campaign",
  party: "Party",
  push_your_luck: "Push Your Luck",
  quick_play: "Quick Play",
  strategy: "Strategy",
  tile_laying: "Tile Laying",
  trivia: "Trivia",
  two_player: "Two Player",
  war: "War",
  word: "Word"
};

const ratingTargets = {
  "7-wonders": 4.35,
  agricola: 4.35,
  azul: 4.4,
  backgammon: 4.1,
  blokus: 4.0,
  carcassonne: 4.25,
  catan: 4.5,
  chess: 4.65,
  codenames: 4.45,
  dominion: 4.35,
  everdell: 4.35,
  gloomhaven: 4.7,
  go: 4.7,
  "king-of-tokyo": 4.15,
  "love-letter": 4.1,
  monopoly: 3.35,
  pandemic: 4.35,
  patchwork: 4.3,
  "power-grid": 4.3,
  "puerto-rico": 4.25,
  root: 4.45,
  scrabble: 4.2,
  scythe: 4.35,
  splendor: 4.35,
  "terraforming-mars": 4.55,
  "ticket-to-ride": 4.35,
  "twilight-imperium": 4.65,
  "twilight-struggle": 4.55,
  wingspan: 4.45
};

const metadataOverrides = {
  "7-wonders": { minPlayers: 3, maxPlayers: 7, minAge: 10, durationMinutes: 30, difficulty: "medium" },
  agricola: { minPlayers: 1, maxPlayers: 5, minAge: 12, durationMinutes: 90, difficulty: "hard" },
  azul: { minPlayers: 2, maxPlayers: 4, minAge: 8, durationMinutes: 35, difficulty: "easy" },
  catan: { minPlayers: 3, maxPlayers: 4, minAge: 10, durationMinutes: 75, difficulty: "medium" },
  chess: { minPlayers: 2, maxPlayers: 2, minAge: 6, durationMinutes: 45, difficulty: "hard" },
  codenames: { minPlayers: 4, maxPlayers: 8, minAge: 10, durationMinutes: 15, difficulty: "easy" },
  dominion: { minPlayers: 2, maxPlayers: 4, minAge: 13, durationMinutes: 30, difficulty: "medium" },
  gloomhaven: { minPlayers: 1, maxPlayers: 4, minAge: 14, durationMinutes: 120, difficulty: "hard" },
  go: { minPlayers: 2, maxPlayers: 2, minAge: 8, durationMinutes: 60, difficulty: "hard" },
  monopoly: { minPlayers: 2, maxPlayers: 8, minAge: 8, durationMinutes: 120, difficulty: "medium" },
  pandemic: { minPlayers: 2, maxPlayers: 4, minAge: 8, durationMinutes: 45, difficulty: "medium" },
  scrabble: { minPlayers: 2, maxPlayers: 4, minAge: 10, durationMinutes: 60, difficulty: "medium" },
  "terraforming-mars": { minPlayers: 1, maxPlayers: 5, minAge: 12, durationMinutes: 120, difficulty: "hard" },
  "ticket-to-ride": { minPlayers: 2, maxPlayers: 5, minAge: 8, durationMinutes: 45, difficulty: "easy" },
  wingspan: { minPlayers: 1, maxPlayers: 5, minAge: 10, durationMinutes: 60, difficulty: "medium" }
};

const materialDetails = {
  bags: ["Bags", "bags", 1, "Opaque draw bags or player bags."],
  blocks: ["Blocks", "blocks", 54, "Wooden or plastic stacking blocks."],
  board: ["Board", "board", 1, "Main game board."],
  boards: ["Player boards", "board", 4, "One player board per player."],
  cards: ["Cards", "cards", 1, "Game deck or card sets."],
  "character-boards": ["Character boards", "board", 2, "Guessing frames or character boards."],
  "chess-set": ["Chess set", "pieces", 1, "Chess board and 32 pieces."],
  checkerboard: ["Checkerboard", "board", 1, "8 by 8 checkerboard."],
  "cribbage-board": ["Cribbage board", "board", 1, "Score track with pegs."],
  dice: ["Dice", "dice", 2, "Standard dice or game-specific dice."],
  discs: ["Discs", "pieces", 42, "Colored player discs."],
  dominoes: ["Dominoes", "tiles", 28, "A domino set."],
  grid: ["Grid", "board", 1, "Grid board or printed grid."],
  "go-board": ["Go board", "board", 1, "Board with line intersections."],
  "letter-cubes": ["Letter cubes", "dice", 16, "Letter dice or cubes."],
  "letter-tiles": ["Letter tiles", "tiles", 100, "Letter tiles for word play."],
  "mancala-board": ["Mancala board", "board", 1, "Two-row pit board."],
  markers: ["Markers", "writing", 4, "Dry-erase or paper markers."],
  meeples: ["Meeples", "pieces", 40, "Wooden player meeples."],
  miniatures: ["Miniatures", "pieces", 10, "Miniature figures or standees."],
  money: ["Money", "money", 1, "Paper money, coins or currency tokens."],
  paper: ["Paper", "paper", 1, "Score sheets or blank paper."],
  pegs: ["Pegs", "pieces", 1, "Code and feedback pegs."],
  pen: ["Pen", "writing", 2, "Pens or pencils for scoring."],
  pieces: ["Pieces", "pieces", 16, "Player pieces."],
  "player-boards": ["Player boards", "board", 4, "Individual player boards."],
  "polyomino-pieces": ["Polyomino pieces", "pieces", 84, "Tetris-like placement pieces."],
  screens: ["Screens", "other", 2, "Team screens or hidden information screens."],
  spinner: ["Spinner", "other", 1, "Movement spinner."],
  standees: ["Standees", "pieces", 10, "Character or monster standees."],
  stones: ["Stones", "tokens", 80, "Stones, beads or counters."],
  timer: ["Timer", "timer", 1, "Sand timer or phone timer."],
  tiles: ["Tiles", "tiles", 60, "Game tiles."],
  tokens: ["Tokens", "tokens", 20, "Counters, markers or resource tokens."],
  "train-pieces": ["Train pieces", "pieces", 45, "Plastic train pieces."]
};

const coverImages = [
  "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1606503153255-59d8b8b82176?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1547638375-ebf04735d792?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80"
];

async function main() {
  const curatedGames = JSON.parse(await readFile(path.join(__dirname, "..", "database", "curated-games.json"), "utf8"));
  const games = [...localGames, ...curatedGames];

  await prisma.user.upsert({
    where: { email: "admin@quejugamos.local" },
    update: { displayName: "Admin QueJugamos", role: "admin" },
    create: {
      id: "99999999-9999-9999-9999-999999999999",
      email: "admin@quejugamos.local",
      displayName: "Admin QueJugamos",
      role: "admin"
    }
  });

  for (const user of syntheticUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { displayName: user.displayName, role: user.role },
      create: user
    });
  }

  for (const [slug, name] of Object.entries(categoryNames)) {
    await prisma.category.upsert({
      where: { slug: slug.replaceAll("_", "-") },
      update: { name },
      create: { name, slug: slug.replaceAll("_", "-") }
    });
  }

  const categoryBySlug = new Map((await prisma.category.findMany()).map((category) => [category.slug, category.id]));

  for (const game of games) {
    for (const materialSlug of game.materials) {
      const [name, kind] = materialDetails[materialSlug] ?? [slugToName(materialSlug), "other"];
      await prisma.material.upsert({
        where: { slug: materialSlug },
        update: { name, kind, aliases: aliasesFor(materialSlug) },
        create: { name, slug: materialSlug, kind, aliases: aliasesFor(materialSlug) }
      });
    }
  }

  const materialBySlug = new Map((await prisma.material.findMany()).map((material) => [material.slug, material.id]));

  for (const [index, game] of games.entries()) {
    const metadata = metadataFor(game);
    const categories = game.categories ?? categoriesFor(game);
    const ratingTarget = game.ratingTarget ?? ratingTargets[game.slug] ?? targetFor(categories, metadata.difficulty);

    const savedGame = await prisma.game.upsert({
      where: { slug: game.slug },
      update: {
        title: game.title,
        summaryMd: summaryFor(game),
        rulesMd: rulesFor(game),
        rulesSourceUrl: game.rulesSourceUrl ?? null,
        minPlayers: metadata.minPlayers,
        maxPlayers: metadata.maxPlayers,
        minAge: metadata.minAge,
        difficulty: metadata.difficulty,
        durationMinutes: metadata.durationMinutes,
        indoor: true,
        outdoor: Boolean(game.outdoor),
        status: "approved"
      },
      create: {
        title: game.title,
        slug: game.slug,
        summaryMd: summaryFor(game),
        rulesMd: rulesFor(game),
        rulesSourceUrl: game.rulesSourceUrl ?? null,
        minPlayers: metadata.minPlayers,
        maxPlayers: metadata.maxPlayers,
        minAge: metadata.minAge,
        difficulty: metadata.difficulty,
        durationMinutes: metadata.durationMinutes,
        indoor: true,
        outdoor: Boolean(game.outdoor),
        status: "approved"
      }
    });

    await prisma.gameMaterial.deleteMany({ where: { gameId: savedGame.id } });
    await prisma.gameCategory.deleteMany({ where: { gameId: savedGame.id } });
    await prisma.gameAsset.deleteMany({ where: { gameId: savedGame.id } });
    await prisma.gameRating.deleteMany({ where: { gameId: savedGame.id } });

    await prisma.gameMaterial.createMany({
      data: game.materials.map((materialSlug) => {
        const detail = materialDetails[materialSlug];
        return {
          gameId: savedGame.id,
          materialId: materialBySlug.get(materialSlug),
          requirementType: "required",
          quantity: detail?.[2] ?? 1,
          notes: detail?.[3] ?? `Use ${slugToName(materialSlug).toLowerCase()} for setup or scoring.`
        };
      })
    });

    await prisma.gameCategory.createMany({
      data: categories
        .map((slug) => categoryBySlug.get(slug.replaceAll("_", "-")))
        .filter(Boolean)
        .map((categoryId) => ({ gameId: savedGame.id, categoryId }))
    });

    await prisma.gameAsset.createMany({
      data: [
        {
          gameId: savedGame.id,
          kind: "cover",
          sourceType: "manual_url",
          publicUrl: coverImages[index % coverImages.length],
          sourceUrl: "https://unsplash.com/s/photos/board-game",
          credit: "Unsplash",
          licenseLabel: "Unsplash License",
          contentType: "image/jpeg",
          altText: `${game.title} tabletop cover image`,
          sortOrder: 0
        },
        ...(game.rulesSourceUrl
          ? [
              {
                gameId: savedGame.id,
                kind: "other",
                sourceType: "manual_url",
                publicUrl: game.rulesSourceUrl,
                sourceUrl: game.rulesSourceUrl,
                credit: "Wikipedia",
                licenseLabel: "External HTML reference",
                contentType: "text/html",
                altText: `${game.title} rules reference`,
                sortOrder: 100
              }
            ]
          : [])
      ]
    });

    const ratings = ratingsFor(ratingTarget).map((value, ratingIndex) => ({
      gameId: savedGame.id,
      userId: syntheticUsers[ratingIndex].id,
      value,
      comment: commentFor(value)
    }));
    await prisma.gameRating.createMany({ data: ratings });

    const average = ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length;
    await prisma.game.update({
      where: { id: savedGame.id },
      data: {
        ratingAverage: average.toFixed(2),
        ratingCount: ratings.length
      }
    });
  }
}

function metadataFor(game) {
  if (metadataOverrides[game.slug]) return metadataOverrides[game.slug];
  if (game.minPlayers) return game;
  const categories = categoriesFor(game);
  if (categories.includes("party")) return { minPlayers: 4, maxPlayers: 10, minAge: 10, durationMinutes: 30, difficulty: "easy" };
  if (categories.includes("two-player")) return { minPlayers: 2, maxPlayers: 2, minAge: 10, durationMinutes: 30, difficulty: "medium" };
  if (categories.includes("strategy")) return { minPlayers: 2, maxPlayers: 4, minAge: 12, durationMinutes: 75, difficulty: "hard" };
  if (categories.includes("cards")) return { minPlayers: 2, maxPlayers: 6, minAge: 8, durationMinutes: 25, difficulty: "easy" };
  return { minPlayers: 2, maxPlayers: 5, minAge: 8, durationMinutes: 45, difficulty: "medium" };
}

function categoriesFor(game) {
  const text = `${game.title} ${game.materials.join(" ")}`.toLowerCase();
  const categories = new Set(["family"]);
  if (text.includes("chess") || text.includes("go") || text.includes("checkers") || text.includes("othello")) categories.add("abstract");
  if (text.includes("cards")) categories.add("cards");
  if (text.includes("dice")) categories.add("dice");
  if (text.includes("tiles") || text.includes("domino") || text.includes("azul") || text.includes("carcassonne")) categories.add("tile-laying");
  if (text.includes("codenames") || text.includes("dixit") || text.includes("taboo") || text.includes("pictionary")) categories.add("party");
  if (text.includes("clue") || text.includes("mysterium") || text.includes("decrypto")) categories.add("deduction");
  if (text.includes("pandemic") || text.includes("hanabi") || text.includes("forbidden")) categories.add("cooperative");
  if (text.includes("risk") || text.includes("diplomacy") || text.includes("twilight struggle")) categories.add("war");
  if (text.includes("monopoly") || text.includes("acquire") || text.includes("power grid")) categories.add("economic");
  if (text.includes("scrabble") || text.includes("boggle") || text.includes("scattergories")) categories.add("word");
  if (text.includes("jenga")) categories.add("dexterity");
  if (text.includes("trivial")) categories.add("trivia");
  if (text.includes("jaipur") || text.includes("patchwork") || text.includes("lost cities") || text.includes("onitama")) categories.add("two-player");
  if (text.includes("terraforming") || text.includes("gloomhaven") || text.includes("scythe") || text.includes("root")) categories.add("strategy");
  if (categories.size === 1) categories.add("gateway");
  return [...categories];
}

function targetFor(categories, difficulty) {
  if (difficulty === "hard") return 4.3;
  if (categories.includes("party")) return 4.05;
  if (categories.includes("classic")) return 4.0;
  return 4.15;
}

function ratingsFor(target) {
  const count = 20;
  const total = Math.max(count, Math.min(count * 5, Math.round(target * count)));
  const ratings = Array.from({ length: count }, () => 3);
  let remaining = total - ratings.reduce((sum, value) => sum + value, 0);
  for (let index = 0; remaining > 0; index = (index + 1) % count) {
    if (ratings[index] < 5) {
      ratings[index] += 1;
      remaining -= 1;
    }
  }
  return ratings.sort((left, right) => right - left);
}

function rulesFor(game) {
  const base = game.rulesMd.replace(/\s+/g, " ").trim();
  return `## Objetivo
${base}

## Preparacion
Reuni los materiales indicados, separa el espacio de juego y entrega a cada participante sus componentes iniciales.

## Turno
Los jugadores actuan en orden, aplican la accion principal del juego y actualizan tablero, mano, recursos o puntuacion segun corresponda.

## Fin de partida
La partida termina cuando se cumple la condicion de victoria del juego o cuando ya no quedan acciones legales relevantes.

## Consejos
Explica una ronda de ejemplo antes de empezar y deja visibles las condiciones de puntuacion para reducir consultas durante la partida.`;
}

function summaryFor(game) {
  return game.rulesMd.split(".")[0].trim() + ".";
}

function aliasesFor(slug) {
  return [...new Set([slug.replaceAll("-", " "), slugToName(slug).toLowerCase()])];
}

function slugToName(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function commentFor(value) {
  if (value >= 5) return "Excelente para recomendar y volver a jugar.";
  if (value === 4) return "Muy buen juego, funciona bien con el grupo correcto.";
  if (value === 3) return "Correcto y facil de sacar a mesa.";
  return "Tiene momentos buenos, aunque depende mucho del grupo.";
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
