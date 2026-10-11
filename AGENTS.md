# Architecture rules

- Store individual order read revisions in browser storage scoped to the signed-in admin, independently of tab-level notifications, so opening a tab does not mark its orders as read.
- Keep traced signboard lettering separate from the shared BrandLogo layout, so header and product-page logos share the same artwork without modifying the original emblem.
- Keep the homepage category tiles permanent (no layout switcher): hero, then category tiles, then product grid.
- Keep direct Buy Now checkout local to the product page and separate from the saved cart; use the shared checkout drawer and completion helper so direct purchases cannot charge or clear saved items.
