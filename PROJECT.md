# My Virtual Library

A self-hosted, browser-first, walkable 3D library for e-books and audiobooks, based on [Halcyon Video](https://github.com/halcyon-video/halcyon-video).

> Status: early planning/conversion. This fork still runs Halcyon Video; bookstore functionality has not yet shipped.

## Product vision

Enter a virtual library from a desktop or mobile browser. Walk between shelves arranged by author, series, genre, or collection; pick up a book, inspect its front/back and metadata, then read an e-book or listen to an audiobook without leaving the experience.

## MVP success criteria

- A browser-hosted 3D library renders without an external service.
- A deterministic sample catalog stocks shelves with books, not movies.
- A user can navigate shelves, select a title and inspect cover, author, series, description and available formats.
- Library content uses a provider-independent book model.
- A simple self-hosted deployment and setup guide exists.
- No library credentials or private media files are embedded in the client bundle or committed to git.

## Not in the first milestone

Account management, multi-user sharing, DRM bypass, cloud sync, paid content catalogs, public hosting of copyrighted books, and full audio/EPUB playback are later, separately scoped work.

## Design principles

1. Preserve upstream attribution and GPL-3.0 notices.
2. Preserve the original Halcyon `master` branch during initial conversion; work on `develop` and feature branches.
3. Adapt Three.js world/navigation/rendering before replacing functioning foundations.
4. Keep catalogs and provider adapters independent from visual objects and interaction logic.
5. Treat audio and EPUB reading as distinct clients; do not repurpose video player internals indiscriminately.
6. Favor local-first storage, accessible controls, keyboard navigation, and progressive enhancement.
7. Never commit API keys, passwords, copyrighted media, or personally identifiable library exports.

## Upstream

Original project: https://github.com/halcyon-video/halcyon-video

License: GNU GPL v3. See [LICENSE](LICENSE). Fork status and Git history preserve origin; modifications must be identified and applicable notices retained.

## Development

The inherited build has not yet been validated as part of this conversion. After cloning, follow the existing Halcyon README for runtime prerequisites, then run:

```bash
npm ci
npm run check
```

We will replace these instructions with project-specific commands as the conversion progresses. Do not treat the inherited release configuration and demo links as My Virtual Library releases.
