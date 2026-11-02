/// <reference types="node" />
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { categoryProductCount, uniqueCategoryName } from "./categoryManagement";

const KNOWN = ["Etikoppaka toys", "Brass collection", "Buttabomma Custom Made"];

test("added categories without products can be removed", () => {
  assert.equal(categoryProductCount("Buttabomma Custom Made", ["Brass collection", null]), 0);
});

test("categories used by products are protected regardless of case or surrounding spaces", () => {
  assert.equal(categoryProductCount("Buttabomma Custom Made", [" BUTTABOMMA CUSTOM MADE ", "Buttabomma Custom Made", null]), 2);
});

test("a new category name is accepted with surrounding spaces removed", () => {
  assert.equal(uniqueCategoryName("  Wall decor yellow  ", KNOWN), "Wall decor yellow");
});

test("adding categories rejects blanks and case-insensitive duplicates", () => {
  assert.equal(uniqueCategoryName("   ", KNOWN), null);
  assert.equal(uniqueCategoryName(" BRASS COLLECTION ", KNOWN), null);
  assert.equal(uniqueCategoryName("buttabomma custom made", KNOWN), null);
});
