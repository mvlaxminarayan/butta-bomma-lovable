# Architecture rules

- Keep the homepage eager and lazy-load other routes; share overlapping storefront catalog reads and batch short-lived photo links in memory per auth identity, so unrelated pages and duplicate signing do not delay first load.

- Keep product photo swipes active only at unzoomed scale and cancel them for multi-touch, so pinch zoom and zoomed panning do not switch photos; arrows and thumbnails share selection and zoom reset.

- Snapshot catalog filters, sorting, pagination and scroll position in navigation history for catalog and spotlight product links; preserve it through product errors and cart detours so Back to Shop and browser Back retain shopping context.

- Use neutral placeholders for unresolved admin product photos, never sample artwork, so loading cannot misrepresent an item's photo.
- Share the product availability guard across purchase actions while keeping detail navigation independent, so unavailable items remain viewable without enabling purchases.

- Store individual order read revisions in browser storage scoped to the signed-in admin, independently of tab-level notifications, so opening a tab does not mark its orders as read.
- Keep traced signboard lettering separate from the shared BrandLogo layout, so header and product-page logos share the same artwork without modifying the original emblem.
- Keep the homepage category tiles permanent (no layout switcher): hero, then category tiles, then product grid.
- Keep direct Buy Now checkout local to the product page and separate from the saved cart; use the shared checkout drawer and completion helper so direct purchases cannot charge or clear saved items.
- Book shipments only through the admin-only shiprocket edge function, which writes courier/AWB back to the order and stores the Shiprocket shipment id in status_history, so the label can be reprinted without a schema change.
- Order status validation must append to the incoming status_history (falling back to existing history), so shipment metadata saved with a status change survives atomically.

- Never ship sample/demo photos in the repo or as fallbacks; empty sections hide instead, so customers only see real store photos.
- Resolve private photo allowlists through the exposed `api` schema and surface lookup failures, so inaccessible data cannot silently hide all storefront photos.
- Persist custom categories immediately in the admin-only categories table exposed through the security-invoker api view; merge saved categories with official and product-derived choices so unused categories survive refreshes.
- Remove saved custom categories through the security-invoker api view with admin-only deletion policies and a database usage guard; never delete or recategorize their products implicitly.
- Keep category popovers modal so their portaled lists own the active scroll lock inside product dialogs and accept both wheel and touch scrolling.
- Keep category creation and removal in the Manage categories dialog; product forms only pick from the list, so every category change has one home and duplicates are blocked before saving.
- Store shipping weight in grams and share legacy-weight parsing with shipment booking, so quotes and shipments use the same item mass.
- Use signed, expiring server-priced shipping quotes for Razorpay orders and snapshot shipping/weight/courier in payment notes, so client totals cannot alter the charged shipping and paid orders retain their quote.

