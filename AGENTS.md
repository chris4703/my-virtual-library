# Coding agent instructions — My Virtual Library

## Purpose
Convert the Halcyon Video fork into a self-hosted browser-first 3D e-book and audiobook library. See [PROJECT.md](PROJECT.md), [docs/architecture.md](docs/architecture.md), and [docs/roadmap.md](docs/roadmap.md).

## Safety and scope
- Work in feature branches based on `develop`; submit focused pull requests. Do not directly alter `master` for early conversion work.
- Preserve Git history, upstream attribution, LICENSE and required notices under GPL-3.0.
- Never commit credentials, tokens, personal book data, media files, proprietary covers, or DRM circumvention code.
- Do not rename everything or delete entire subsystems until dependencies and tests are understood.
- Avoid changing upstream `README.md` and release/publish config to claim bookstore features that do not yet exist.
- Distinguish changes implemented from proposals; explicitly note tests run and tests not run.

## Implementation preferences
- TypeScript, strict types, provider-independent domain model and pure transformation functions.
- Reuse existing Three.js rendering, navigation, performance and texture infrastructure whenever practical.
- Separate source adapters from book catalog domain, view model, 3D scene and reading/listening UI.
- Prefer deterministic demo fixtures and unit tests before connected-source functionality.
- Gracefully handle missing artwork, absent ISBN/series, multiple editions, and books with both e-book and audiobook formats.
- Design responsive and keyboard-accessible interactions; avoid keyboard/mouse-only user journeys.

## Validation
- Baseline: `npm ci && npm run check` (first verify inherited scripts and environment).
- When changing a component, add or update tests where feasible and provide manual browser verification steps.
- Never assert build/test success without actual execution.

## Recommended first implementation slice
Create `src/books/` domain types + normalization and sample data with tests, then adapt the smallest reusable book object/inspection path. Keep the video catalog functional behind the existing path during migration.
