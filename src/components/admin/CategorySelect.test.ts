import { expect, test } from "bun:test";
import { STORE_CATEGORIES, extraCategories } from "./CategorySelect";

test("dropdown offers exactly the shop's eight categories, in order", () => {
  expect(STORE_CATEGORIES).toEqual([
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
  expect(
    extraCategories(["Wall decor yellow", " Kondapalli Toys ", null, "", "Etikoppaka toys"])
  ).toEqual(["Wall decor yellow"]);
});
