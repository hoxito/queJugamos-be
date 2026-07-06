import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import pg from "pg";

const { Client } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://quejugamos:quejugamos@localhost:5432/quejugamos";

const curatedPath = new URL("../database/curated-games.json", import.meta.url);
const games = JSON.parse(await readFile(curatedPath, "utf8"));

const client = new Client({ connectionString: DATABASE_URL });

const slugToName = (slug) =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const materialKind = (slug) => {
  if (["paper", "pen", "markers"].includes(slug)) return slug === "paper" ? "paper" : "writing";
  if (["cards", "letter-tiles", "tiles", "dominoes"].includes(slug)) return slug === "cards" ? "cards" : "other";
  if (["dice"].includes(slug)) return "dice";
  if (["timer", "spinner"].includes(slug)) return "timer";
  if (["tokens", "stones", "discs", "cubes", "meeples", "train-pieces", "pieces", "blocks"].includes(slug)) return "tokens";
  return "other";
};

const xmlText = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1].trim()) : null;
};

const xmlAttribute = (xml, tag, attr) => {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`));
  return match ? decodeXml(match[1]) : null;
};

const decodeXml = (value) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

async function bggSearch(title) {
  const url = `https://boardgamegeek.com/xmlapi2/search?type=boardgame&exact=1&query=${encodeURIComponent(title)}`;
  const response = await fetch(url, { headers: { "User-Agent": "QueJugamos research importer" } });
  if (!response.ok) return null;
  const xml = await response.text();
  return xmlAttribute(xml, "item", "id");
}

async function bggThing(id) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&type=boardgame&stats=1`;
  const response = await fetch(url, { headers: { "User-Agent": "QueJugamos research importer" } });
  if (!response.ok) return null;
  const xml = await response.text();
  return {
    image: xmlText(xml, "image"),
    thumbnail: xmlText(xml, "thumbnail"),
    minPlayers: Number(xmlAttribute(xml, "minplayers", "value")),
    maxPlayers: Number(xmlAttribute(xml, "maxplayers", "value")),
    minAge: Number(xmlAttribute(xml, "minage", "value")),
    playingTime: Number(xmlAttribute(xml, "playingtime", "value"))
  };
}

async function ensureMaterial(slug) {
  const result = await client.query(
    `
      INSERT INTO materials (name, slug, kind, aliases)
      VALUES ($1, $2, $3, '{}')
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name,
          kind = EXCLUDED.kind,
          updated_at = now()
      RETURNING id
    `,
    [slugToName(slug), slug, materialKind(slug)]
  );
  return result.rows[0].id;
}

async function upsertGame(game, bgg) {
  const result = await client.query(
    `
      INSERT INTO games (
        title,
        slug,
        summary_md,
        rules_md,
        rules_source_url,
        external_source,
        external_id,
        min_players,
        max_players,
        min_age,
        difficulty,
        duration_minutes,
        indoor,
        outdoor,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'medium', $11, true, false, 'approved')
      ON CONFLICT (slug) DO UPDATE
      SET title = EXCLUDED.title,
          summary_md = EXCLUDED.summary_md,
          rules_md = EXCLUDED.rules_md,
          rules_source_url = EXCLUDED.rules_source_url,
          external_source = EXCLUDED.external_source,
          external_id = EXCLUDED.external_id,
          min_players = EXCLUDED.min_players,
          max_players = EXCLUDED.max_players,
          min_age = EXCLUDED.min_age,
          duration_minutes = EXCLUDED.duration_minutes,
          status = EXCLUDED.status,
          updated_at = now()
      RETURNING id
    `,
    [
      game.title,
      game.slug,
      game.rulesMd.split(".")[0] + ".",
      game.rulesMd,
      game.rulesSourceUrl ?? null,
      bgg?.id ? "boardgamegeek" : null,
      bgg?.id ? String(bgg.id) : null,
      bgg?.minPlayers || 2,
      bgg?.maxPlayers || Math.max(2, game.materials.includes("cards") ? 6 : 4),
      bgg?.minAge || 8,
      bgg?.playingTime || 30
    ]
  );
  return result.rows[0].id;
}

async function upsertAsset(gameId, game, bgg) {
  const urls = [bgg?.image, bgg?.thumbnail].filter(Boolean);

  for (const [index, url] of urls.entries()) {
    await client.query(
      `
        INSERT INTO game_assets (
          game_id,
          kind,
          source_type,
          public_url,
          source_url,
          credit,
          license_label,
          content_type,
          alt_text,
          sort_order
        )
        VALUES ($1, $2, 'manual_url', $3, $4, 'BoardGameGeek', 'BGG XML API - non-commercial use with attribution', 'image/jpeg', $5, $6)
      `,
      [
        gameId,
        index === 0 ? "cover" : "image",
        url,
        `https://boardgamegeek.com/boardgame/${bgg.id}`,
        `${game.title} image`,
        index
      ]
    );
  }
}

await client.connect();

const enrichWithBgg = process.argv.includes("--bgg");

for (const [index, game] of games.entries()) {
  let bgg = null;

  if (enrichWithBgg) {
    const id = await bggSearch(game.title);
    await delay(5000);
    if (id) {
      const thing = await bggThing(id);
      await delay(5000);
      bgg = { id, ...thing };
    }
  }

  const gameId = await upsertGame(game, bgg);

  for (const material of game.materials) {
    const materialId = await ensureMaterial(material);
    await client.query(
      `
        INSERT INTO game_materials (game_id, material_id, requirement_type)
        VALUES ($1, $2, 'required')
        ON CONFLICT (game_id, material_id) DO UPDATE
        SET requirement_type = EXCLUDED.requirement_type
      `,
      [gameId, materialId]
    );
  }

  if (bgg?.image) {
    await upsertAsset(gameId, game, bgg);
  }

  console.log(`${index + 1}/${games.length} ${game.title}${bgg?.id ? ` BGG:${bgg.id}` : ""}`);
}

await client.end();
