# Live development preview

## GitHub Codespaces (no local installation required)

1. On GitHub, open **Code → Codespaces → Create codespace** using the branch `feat/walkable-book-preview`. Make sure the branch selector shows the feature branch rather than `master`.
2. After the workspace finishes its first-time dependency installation, open its integrated terminal.
3. Run `bash tools/start-codespaces-dev.sh`.
4. In **Ports**, open forwarded port **1420** (keep visibility **Private**).
5. Visit `/book-preview.html` on that forwarded URL for the reading room. The root `/` still loads the original Halcyon application.
6. Save edited files to see Vite hot reload. Stop the development server with Ctrl+C.

The Codespace is a development machine hosted by GitHub. Close/stop it when not using it to manage compute usage. Do not make its forwarded port public or add personal media credentials to this experimental preview.

## Local Mac development (alternative)

Requires Node.js 22 and npm. Clone the feature branch, then run:

```sh
PUPPETEER_SKIP_DOWNLOAD=1 npm ci
npm run dev
```

Open `http://localhost:1420/book-preview.html`. For a local clone, normal Git usage is needed to switch/pull branches. Docker is **not required** for this stage.

## Troubleshooting

- If the forwarded URL reports "Host not allowed", use `tools/start-codespaces-dev.sh` rather than raw `npm run dev`. It adds just the current Codespaces hostname to the allowlist.
- The reading room is an independent book experience; the root remains the upstream application. Without a configured source, it uses clearly labeled fictional sample metadata.
- WebGL support depends on the browser/device. Use current Chrome, Firefox, Safari or Edge with hardware acceleration enabled.
- Existing `npm run check` remains the main build/test gate.

## Reading room preview

`/book-preview.html` now opens the standalone reading room with eight walnut display galleries, arched woodland windows, paneled walls, a woven runner, pendant lights, and a leather-chair reading lounge. Ambient occlusion and soft shadows add depth to the joinery and books. Without a connected source, twelve fictional titles repeat as demonstration stock.

- Walk with WASD or up/down arrows. Turn with left/right arrows, or drag the scene to look around.
- On touch screens, hold the bottom movement buttons and drag the scene to look.
- Shelf and room bounds stop walking through shelves or out of the room.
- Click a nearby book cover to inspect its title, author, description, and formats.
- Browse books searches title, author, series, and genre; filter by audiobook/e-book and sort by title/author. Cover rows load in batches of 36. Escape closes panels; Entrance resets the view. **Find on shelf** selects the correct shelf page and takes you to the selected cover.
- Reading and listening use the linked Audiobookshelf page for connected titles. Sample titles are explicitly identified.

Verification: run `npm run check` and manually check walking, shelf collision, entrance reset, cover selection, search by author and genre, empty search results, and the collection/details panels at a narrow phone viewport.

## Audiobookshelf connection (private preview)

The reading room can load a real catalog through a server-only gateway. Configure these **non-VITE-prefixed** environment variables when starting the development server:

- `MVL_ABS_URL`: fixed Audiobookshelf base URL, including any reverse-proxy subpath; use HTTPS except for explicitly supported local container/loopback addresses.
- `MVL_ABS_LIBRARY_ID`: the one library this gateway may read.
- `MVL_ABS_USERNAME` and `MVL_ABS_PASSWORD`: a dedicated non-admin Audiobookshelf account with no upload, edit, or delete permissions.

Supply the password through a secret environment manager or hidden terminal input (`read -rs MVL_ABS_PASSWORD` followed by `export MVL_ABS_PASSWORD`). Do not put it in shell command arguments, screenshots, checked-in configuration, or any `VITE_` variable. The current Codespace setup keeps the password only in its running shell/server environment; restarting that session requires supplying it again.

Click **Load Audiobookshelf** in the reading room. Only this source preference is remembered in browser storage, so later visits reconnect automatically; catalog data and credentials are not persisted in browser storage. The server logs in using Audiobookshelf's user authentication flow, keeps access/rotating refresh tokens in memory, fetches catalog pages, and returns only the normalized book fields. The browser receives neither credentials nor tokens, filesystem paths, or raw upstream objects. Metadata is cached in server memory for one minute. There are no write, media-download, arbitrary URL proxy, or account-management endpoints. Cover reads are limited to IDs actually present in the configured library, with image-type and response-size limits. Cross-site browser requests are rejected.

All titles are searchable. The room displays up to 320 distinct items at a time; **Shelves** cycles through the remaining items. Existing source editions stay separate; duplicate-title grouping is future work. Covers are loaded on demand in the collection, details, and all front-facing shelf books. Format-specific **Audiobook in Audiobookshelf** and **E-book in Audiobookshelf** links open the original item's page in a new tab; Audiobookshelf handles its own browser sign-in, reading, listening, and progress. In-app playback/progress synchronization is not implemented.

This shared-account gateway relies on **private Codespaces forwarding** for viewer access control. Keep port 1420 private. Before any public or household deployment, add application authentication and decide whether users share a catalog or sign in individually. The middleware is installed for both Vite development and Vite preview; a static-only deployment cannot serve the gateway. No Audiobookshelf data or cover art belongs in Git, build artifacts, or public test fixtures.

## Rendering and verification

Book geometry is merged per gallery with a cover atlas, while selection maps triangles back to their book. Geometry/materials/textures from replaced stock are disposed. The room renders only after a camera, source, cover, or viewport change; it holds the last frame while idle. Add `?stats=1` to inspect draw calls, triangle count, and rendered-frame count. Ambient occlusion reuses the existing N8AO dependency with half-resolution sampling and no temporal accumulation.

Check a connected dual-format book from Browse books, verify its actual cover and metadata, choose Find on shelf, and click the matching cover. Confirm both format links point to the original Audiobookshelf entry. Test format filters, second-page shelves, and narrow-screen layout. Keep forwarded port 1420 private.

### Cover galleries

The enlarged room has eight freestanding, double-sided galleries with four rows per side and five cover-facing books per row. The floor footprint grows from roughly 24 × 25 to 32 × 35 scene units, with wider aisles and spare perimeter space for future genre zones. Stock remains alphabetical for now; genre zoning is not implemented. The shared layout constants drive placement, paging, and Find on shelf.

Real artwork fills each gallery atlas progressively, prioritizing the entrance galleries and limiting cover requests to four at a time. A typographic cover remains available if artwork is absent or fails. Late requests from a previous shelf page cannot overwrite the new page. Covers retain their aspect ratio and do not trigger shadow-map rebuilds.
