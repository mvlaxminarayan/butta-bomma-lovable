/// <reference types="node" />
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { categoryProductCount } from "./categoryManagement";

test("added categories without products can be removed", () => {
  assert.equal(categoryProductCount("Buttabomma Custom Made", ["Brass collection", null]), 0);
});

test("categories used by products are protected regardless of case or surrounding spaces", () => {
  assert.equal(categoryProductCount("Buttabomma Custom Made", [" BUTTABOMMA CUSTOM MADE ", "Buttabomma Custom Made", null]), 2);
});