import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const require = createRequire(import.meta.url);
const Converter = require("openapi-to-postmanv2");
const convertOpenApi = promisify(Converter.convert);
const docsDir = path.resolve("docs", "api");
const openApiPath = path.join(docsDir, "openapi.json");
const postmanPath = path.join(docsDir, "postman_collection.json");

export function stableJson(value) {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

export async function convertOpenApiToPostman(openApi) {
  const conversion = await convertOpenApi(
    {
      type: "json",
      data: openApi
    },
    {
      folderStrategy: "Tags",
      parametersResolution: "Example",
      requestNameSource: "Fallback",
      schemaFaker: true
    }
  );

  if (!conversion.result) {
    throw new Error(`Could not convert OpenAPI to Postman: ${conversion.reason ?? "Unknown error"}`);
  }

  return stripGeneratedPostmanIds(conversion.output[0].data);
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
}

function stripGeneratedPostmanIds(value) {
  if (Array.isArray(value)) return value.map(stripGeneratedPostmanIds);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "id" && key !== "_postman_id")
      .map(([key, item]) => [key, stripGeneratedPostmanIds(item)])
  );
}

async function generateOpenApiDocument() {
  const { NestFactory } = require("@nestjs/core");
  const { AppModule } = require("../dist/app.module");
  const { configureApiApp, createOpenApiDocument, defaultApiPrefix } = require("../dist/openapi");
  const apiPrefix = process.env.API_PREFIX ?? defaultApiPrefix;
  const app = await NestFactory.create(AppModule, { logger: false });

  try {
    configureApiApp(app, apiPrefix);
    return createOpenApiDocument(app);
  } finally {
    await app.close();
  }
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const document = await generateOpenApiDocument();
  const postman = await convertOpenApiToPostman(document);
  const outputs = [
    [openApiPath, stableJson(document)],
    [postmanPath, stableJson(postman)]
  ];

  await mkdir(docsDir, { recursive: true });

  if (checkOnly) {
    const staleFiles = [];
    for (const [filePath, nextContent] of outputs) {
      const currentContent = await readFile(filePath, "utf8").catch(() => "");
      if (currentContent !== nextContent) staleFiles.push(path.relative(process.cwd(), filePath));
    }

    if (staleFiles.length > 0) {
      console.error(`API docs are stale. Run pnpm api:docs:generate and commit: ${staleFiles.join(", ")}`);
      process.exitCode = 1;
    }
    return;
  }

  for (const [filePath, content] of outputs) {
    await writeFile(filePath, content, "utf8");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
