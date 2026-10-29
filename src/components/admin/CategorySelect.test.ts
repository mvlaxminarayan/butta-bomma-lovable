/// <reference types="node" />
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { STORE_CATEGORIES, extraCategories, newCategoryName } from "./CategorySelect";

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

test("admins can add a new category with surrounding spaces removed", () => {
  assert.equal(newCategoryName("  Wall decor yellow  ", STORE_CATEGORIES.map((value) => ({ value, label: value }))), "Wall decor yellow");
});

test("saved custom categories stay selectable without any products or active form category", () => {
  const savedCategories = ["Buttabomma Custom Made"];
  const productCategories: string[] = [];
  assert.deepEqual(extraCategories([...savedCategories, ...productCategories, ""]), ["Buttabomma Custom Made"]);
});

test("adding categories rejects blanks and case-insensitive duplicates", () => {
  const options = STORE_CATEGORIES.map((value) => ({ value, label: value }));
  assert.equal(newCategoryName("   ", options), null);
  assert.equal(newCategoryName(" BRASS COLLECTION ", options), null);
  assert.deepEqual(extraCategories(["Wall decor yellow", " WALL DECOR YELLOW "]), ["Wall decor yellow"]);
});

test("older categories a product still uses stay selectable, without duplicates", () => {
  // "Kondapalli Toys " is the same category as the official "Kondapalli toys",
  // so it is not offered twice; "Wall decor yellow" is genuinely different.
  assert.deepEqual(
    extraCategories(["Wall decor yellow", " Kondapalli Toys ", null, "", "Etikoppaka toys"]),
    ["Wall decor yellow"]
  );
});
