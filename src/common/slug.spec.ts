import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { toSlug } from "./slug";

describe("toSlug", () => {
  it("normalizes accents, casing and separators", () => {
    assert.equal(toSlug("\u00bfQu\u00e9 Jugamos? Tatet\u00ed Express"), "que-jugamos-tateti-express");
  });

  it("trims duplicate separators and limits the slug length", () => {
    const slug = toSlug(`---${"A".repeat(140)}---`);

    assert.equal(slug.length, 120);
    assert.match(slug, /^a+$/);
  });
});