import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { convertOpenApiToPostman } from "./generate-api-docs.mjs";

describe("generate-api-docs", () => {
  it("converts OpenAPI paths into grouped Postman requests", async () => {
    const collection = await convertOpenApiToPostman({
      openapi: "3.0.0",
      info: {
        title: "Example API",
        description: "Example description",
        version: "1.2.3"
      },
      paths: {
        "/games/{slug}": {
          get: {
            operationId: "GamesController_findBySlug",
            tags: ["games"],
            parameters: [
              {
                in: "query",
                name: "includeComments",
                schema: {
                  type: "boolean",
                  example: true
                }
              }
            ]
          }
        }
      }
    });

    assert.equal(collection.info.name, "Example API");
    assert.equal(collection.item[0].name, "games");
    assert.equal(collection.item[0].item[0].request.method, "GET");
    assert.equal(collection.item[0].item[0].request.url.path.join("/"), "games/:slug");
  });
});
