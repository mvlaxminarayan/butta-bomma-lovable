# Architecture rules

- Store individual order read revisions in browser storage scoped to the signed-in admin, independently of tab-level notifications, so opening a tab does not mark its orders as read.