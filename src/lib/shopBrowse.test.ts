import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { shopReturnLocation } from "./shopBrowse";

describe("Return to the originating shop list", () => {
  it("preserves page 3 rather than returning to page 1", () => {
    const result = shopReturnLocation("", {
      searchQuery: "doll", category: "Traditional dolls", featuredOnly: false,
      wishlistOnly: false, sort: "price-asc", page: 3, scrollY: 1450,
    });
    assert.equal(result.pathname, "/");
    assert.equal(result.state.shopBrowse.page, 3);
    assert.equal(result.state.shopBrowse.category, "Traditional dolls");
    assert.equal(result.state.shopBrowse.searchQuery, "doll");
    assert.equal(result.state.shopBrowse.sort, "price-asc");
    assert.equal(result.state.shopBrowse.scrollY, 1450);
  });
  it("preserves the wishlist list when returning from a saved product", () => {
    const result = shopReturnLocation("?wishlist=1", {
      searchQuery: "", category: "All", featuredOnly: false,
      wishlistOnly: true, sort: "featured", page: 2, scrollY: 900,
    });
    assert.equal(result.search, "?wishlist=1");
    assert.equal(result.state.shopBrowse.wishlistOnly, true);
    assert.equal(result.state.shopBrowse.page, 2);
  });
});