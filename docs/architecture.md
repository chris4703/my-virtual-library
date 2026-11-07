# Architecture proposal — My Virtual Library

## Current inherited foundations

The upstream app is TypeScript + Vite + Three.js with a browser-based 3D retail environment, shelf geometry/placement, cover/case rendering, navigation, search, provider integrations, and optional Docker/Tauri deployments. Existing movie/media-specific logic is coupled to the store experience; map dependencies before deleting it.

## Proposed conceptual boundaries

```text
Library Source Adapters (demo, Audiobookshelf, Calibre/OPDS)
                        |
                  Normalize / Index
                        |
             Book Catalog Domain Model
                        |
              Browse / Search / Sort
                        |
   3D Library Renderer + Book Inspection UI
                        |
            Open Reader / Audio Player
```

### Domain model (proposal, not yet implemented)

- `Book`: stable ID, title, subtitle, description, language, authors, identifiers, publication date, genres/tags, series and index, artwork, source references.
- `Edition`: edition ID, book ID, format (`epub`, `pdf`, `m4b`, or audio track group), availability and source metadata.
- `Progress`: user/source/edition reference, reading location or audio position, update timestamp.
- `Collection`: named or rule-based book grouping for shelves.
- `LibraryProvider`: list/search/get metadata, discover formats, securely resolve cover and open/play URLs, optionally read/write progress.

Use provider-prefixed IDs. Do not assume ISBN is unique or present. Do not store provider secrets in client-visible environment variables or built assets.

### Integration order

1. Local demo book catalog (fixtures) for deterministic development and offline testing.
2. Audiobookshelf adapter for self-hosted audiobooks and available e-books.
3. Calibre / OPDS-compatible catalog integration for books and metadata.
4. Other adapters if users request them.

### Reading / listening

EPUB requires a dedicated browser reader with pagination/reflow, navigation, font preferences, bookmarks and EPUB location persistence. Audiobooks need HTML audio or a suitable streaming player with chapters, resume points and playback speed. PDF support is optional and distinct. DRM-protected sources are not in scope.

### Authentication and deployment

MVP: LAN/self-hosted Docker web service plus sample catalog. Provider adapters must consider browser CORS, token handling, hostname allowlists, SSRF risk in proxying remote URLs, access control, and user isolation before network-connected features are enabled. Avoid exposing personal files publicly by default.

### Rendering conversion strategy

Retain: camera/navigation, shelf layout primitives, performance tuning, cover texture caching, search interaction where reusable.

Replace gradually: video-case meshes with book proportions/spines, movie-specific metadata cards with book information, rental checkout semantics with open/read/listen actions, movie discovery and irrelevant television/game systems.

Keep original features behind a migration boundary until tests and new flows exist. Do not perform a blind global rename.
