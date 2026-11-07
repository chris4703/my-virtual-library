# Live development preview

## GitHub Codespaces (no local installation required)

1. On GitHub, open **Code → Codespaces → Create codespace** using the branch `feat/walkable-book-preview`. Make sure the branch selector shows the feature branch rather than `master`.
2. After the workspace finishes its first-time dependency installation, open its integrated terminal.
3. Run `bash tools/start-codespaces-dev.sh`.
4. In **Ports**, open forwarded port **1420** (keep visibility **Private**).
5. Visit `/book-preview.html` on that forwarded URL for the first 3D bookshelf. The root `/` still loads the original Halcyon application.
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
- The first prototype is **not** the full Halcyon conversion; it's an isolated test scene with fictional book metadata.
- WebGL support depends on the browser/device. Use current Chrome, Firefox, Safari or Edge with hardware acceleration enabled.
- Existing `npm run check` remains the main build/test gate.
