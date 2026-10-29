/// <reference types="node" />
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { STORE_CATEGORIES, extraCategories } from "./CategorySelect";

test("dropdown offers exactly the shop's eight categories, in order", () => {
  assert.deepEqual(STORE_CATEGORIES, [
    "Etikoppaka toys",
    "Kondapalli toys",
    "Chiriyal paintings",
    "Wooden stools",
    "Brass collection",
    "Table lamps",
    "Traditional dolls",
    "Wedding crafts",
  ]);
});

test("older categories a product still uses stay selectable, without duplicates", () => {
  // "Kondapalli Toys " is the same category as the official "Kondapalli toys",
  // so it is not offered twice; "Wall decor yellow" is genuinely different.
  assert.deepEqual(
    extraCategories(["Wall decor yellow", " Kondapalli Toys ", null, "", "Etikoppaka toys"]),
    ["Wall decor yellow"]
  );
});
