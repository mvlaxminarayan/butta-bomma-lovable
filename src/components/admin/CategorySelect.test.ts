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
  expect(
    extraCategories(["Wall decor yellow", " Kondapalli Toys ", null, "", "Etikoppaka toys"])
  ).toEqual(["Kondapalli Toys", "Wall decor yellow"]);
});
