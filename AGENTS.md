# Architecture rules

- Use neutral placeholders for unresolved admin product photos, never sample artwork, so loading cannot misrepresent an item's photo.
- Share the product availability guard across purchase actions while keeping detail navigation independent, so unavailable items remain viewable without enabling purchases.

- Store individual order read revisions in browser storage scoped to the signed-in admin, independently of tab-level notifications, so opening a tab does not mark its orders as read.
- Keep traced signboard lettering separate from the shared BrandLogo layout, so header and product-page logos share the same artwork without modifying the original emblem.
- Keep the homepage category tiles permanent (no layout switcher): hero, then category tiles, then product grid.
- Keep direct Buy Now checkout local to the product page and separate from the saved cart; use the shared checkout drawer and completion helper so direct purchases cannot charge or clear saved items.
- Book shipments only through the admin-only shiprocket edge function, which writes courier/AWB back to the order and stores the Shiprocket shipment id in status_history, so the label can be reprinted without a schema change.
- Order status validation must append to the incoming status_history (falling back to existing history), so shipment metadata saved with a status change survives atomically.

- Never ship sample/demo photos in the repo or as fallbacks; empty sections hide instead, so customers only see real store photos.
- Persist custom categories immediately in the admin-only categories table exposed through the security-invoker api view; merge saved categories with official and product-derived choices so unused categories survive refreshes.
