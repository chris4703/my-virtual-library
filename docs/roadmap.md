# Development roadmap

## Milestone 0 — Foundation (current)
- [x] Create a GitHub fork with upstream history.
- [x] Create a separate `develop` branch.
- [x] Record product vision, architectural boundaries, and coding-agent guidance.
- [ ] Enable GitHub Issues in repository settings and create scoped issues.
- [ ] Clone and run upstream build/tests; record baseline failures and browser preview.
- [ ] Identify actual catalog, shelf, cover, and inspection module entry points.
- [ ] Configure relevant CI checks without publishing upstream-branded artifacts.

## Milestone 1 — First walkable bookstore
- [ ] Create book/edition and provider types, plus tests.
- [ ] Add deterministic example books and placeholder rights-safe cover art.
- [ ] Adapt 3D case dimensions, shelf labels and spine/cover textures to books.
- [ ] Replace movie inspection with title, author, series, synopsis, format.
- [ ] Allow keyboard/mouse navigation, selection and search.
- [ ] Validate performance on a desktop browser.

## Milestone 2 — Real catalogs
- [ ] Audiobookshelf integration design and secure connection tests.
- [ ] Calibre/OPDS integration design and secure connection tests.
- [ ] Stable source IDs, duplicates/editions, missing artwork, sorting and pagination.
- [ ] Add connection/setup UI and privacy documentation.

## Milestone 3 — Read and listen
- [ ] Browser EPUB reader, bookmarks, reading preferences and local progress.
- [ ] Audiobook player, chapters, speed, resume and optional source sync.
- [ ] Cross-format book details and independent progress.
- [ ] Mobile and accessibility review.

## Milestone 4 — Distribute
- [ ] Simplify Docker configuration for bookstore use.
- [ ] Improve onboarding, backups and read-only demo.
- [ ] Review authentication and access controls for household sharing.
- [ ] Publish versioned release with attribution and licensing notices.

## Engineering gates

Each milestone needs reviewable PRs, TypeScript build, tests, manual browser verification, and no accidental secret/media inclusion. Do not represent unchecked items as complete.
