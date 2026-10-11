# Architecture rules

- Store individual order read revisions in browser storage scoped to the signed-in admin, independently of tab-level notifications, so opening a tab does not mark its orders as read.
- Keep traced signboard lettering separate from the shared BrandLogo layout, so header and product-page logos share the same artwork without modifying the original emblem.
- Keep the homepage category tiles permanent (no layout switcher): hero, then category tiles, then product grid.
