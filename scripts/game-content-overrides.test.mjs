import * as assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const overrides = JSON.parse(await readFile(new URL("../database/game-content-overrides.json", import.meta.url), "utf8"));

describe("game content overrides", () => {
  it("stores source-backed manual data for every override", () => {
    for (const [slug, override] of Object.entries(overrides)) {
      assert.match(slug, /^[a-z0-9-]+$/);
      assert.equal(typeof override.summaryMd, "string", `${slug} must define summaryMd`);
      assert.equal(typeof override.rulesMd, "string", `${slug} must define rulesMd`);
      assert.equal(typeof override.rulesSourceUrl, "string", `${slug} must define rulesSourceUrl`);
      assert.equal(typeof override.sourceLabel, "string", `${slug} must define sourceLabel`);
      assert.equal(typeof override.sourceLicenseLabel, "string", `${slug} must define sourceLicenseLabel`);
      assert.ok(override.rulesMd.includes("## Objective"), `${slug} must use detailed Markdown rules`);
      assert.ok(Object.keys(override.materialRequirements ?? {}).length > 0, `${slug} must define material requirements`);
    }
  });

  it("does not label HTML references as PDF assets", () => {
    for (const [slug, override] of Object.entries(overrides)) {
      for (const asset of override.assets ?? []) {
        if (asset.contentType === "text/html") {
          assert.notEqual(asset.kind, "rules_pdf", `${slug} HTML references must not be rules_pdf assets`);
        }
        if (asset.kind === "rules_pdf") {
          assert.equal(asset.contentType, "application/pdf", `${slug} PDF assets must be application/pdf`);
        }
      }
    }
  });
});
