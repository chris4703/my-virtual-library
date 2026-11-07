import { normalizeAbsBook, validAbsId } from '../src/books/audiobookshelf.ts';

const MAX_ITEMS = 10000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export function createAbsGateway(env, fetchImpl = fetch) {
  let base;
  try { base = new URL(env.MVL_ABS_URL); } catch { /* Unconfigured demo mode. */ }
  const libraryId = env.MVL_ABS_LIBRARY_ID || '';
  const configured = Boolean(base && !base.username && !base.password && !base.search && !base.hash &&
    (base.protocol === 'https:' || (base.protocol === 'http:' && ['localhost', '127.0.0.1', 'audiobookshelf'].includes(base.hostname))) &&
    validAbsId(libraryId) && env.MVL_ABS_USERNAME && env.MVL_ABS_PASSWORD);
  let accessToken = '', refreshToken = '', tokenUntil = 0, loginPromise, catalogPromise, cache, cacheUntil = 0;
  const allowedItems = new Set();
  const endpoint = path => `${base.href.replace(/\/$/, '')}${path}`;
  function remember(data) {
    if (typeof data.user?.accessToken !== 'string') throw new Error('authentication');
    accessToken = data.user.accessToken;
    refreshToken = typeof data.user.refreshToken === 'string' ? data.user.refreshToken : '';
    tokenUntil = Date.now() + 10 * 60 * 1000;
  }
  async function login() {
    if (accessToken && Date.now() < tokenUntil) return;
    if (!loginPromise) loginPromise = (async () => {
      if (refreshToken) {
        const response = await fetchImpl(endpoint('/auth/refresh'), {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
          headers: { Origin: base.origin, 'x-refresh-token': refreshToken, 'x-return-tokens': 'true' },
        });
        if (response.ok) { remember(await response.json()); return; }
        refreshToken = '';
      }
      const response = await fetchImpl(endpoint('/login'), {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json', Origin: base.origin, 'x-return-tokens': 'true' },
        body: JSON.stringify({ username: env.MVL_ABS_USERNAME, password: env.MVL_ABS_PASSWORD }),
      });
      if (!response.ok) throw new Error('authentication');
      remember(await response.json());
    })().finally(() => { loginPromise = undefined; });
    await loginPromise;
  }
  async function upstream(path, retry = true) {
    await login();
    const response = await fetchImpl(endpoint(path), {
      headers: { Authorization: `Bearer ${accessToken}`, Origin: base.origin },
      redirect: 'error', signal: AbortSignal.timeout(20000),
    });
    if (response.status === 401 && retry) { accessToken = ''; tokenUntil = 0; return upstream(path, false); }
    if (!response.ok) throw new Error('upstream');
    return response;
  }
  async function catalog() {
    if (cache && Date.now() < cacheUntil) return cache;
    if (!catalogPromise) catalogPromise = (async () => {
      const books = [], seen = new Set(); let total = 0;
      for (let page = 0; page < MAX_ITEMS / 100; page++) {
        const response = await upstream(`/api/libraries/${encodeURIComponent(libraryId)}/items?limit=100&page=${page}&expanded=1&sort=media.metadata.title`);
        const data = await response.json();
        if (!Array.isArray(data.results) || !Number.isFinite(data.total) || data.total < 0) throw new Error('catalog');
        total = data.total;
        for (const item of data.results) {
          if (item.libraryId !== libraryId) continue;
          const book = normalizeAbsBook(item);
          if (book && !seen.has(book.id)) { seen.add(book.id); books.push(book); }
        }
        if (!data.results.length || (page + 1) * 100 >= total) break;
      }
      if (total > MAX_ITEMS) throw new Error('catalog-too-large');
      allowedItems.clear();
      for (const book of books) if (book.coverId) allowedItems.add(book.coverId);
      cache = { source: 'audiobookshelf', books, total, openBase: base.href.replace(/\/$/, '') };
      cacheUntil = Date.now() + 60000;
      return cache;
    })().finally(() => { catalogPromise = undefined; });
    return catalogPromise;
  }
  const json = (res, status, value) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
  async function middleware(req, res, next) {
    if (!(req.url || '').startsWith('/__library/')) return next();
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    // Only a same-origin private preview / authenticated deployment may use this gateway.
    // Cross-site browser requests cannot read it or trigger authenticated upstream reads.
    const origin = req.headers.origin;
    if (req.headers['sec-fetch-site'] === 'cross-site' || (origin && (() => { try { return new URL(origin).host !== req.headers.host; } catch { return true; } })())) return json(res, 403, { error: 'Request origin is not allowed.' });
    if (req.method !== 'GET') return json(res, 405, { error: 'Read-only connection.' });
    if (!configured) return json(res, 503, { error: 'Audiobookshelf is not configured on this server.' });
    try {
      if (req.url === '/__library/catalog') return json(res, 200, await catalog());
      const match = /^\/__library\/cover\/([a-zA-Z0-9_-]{1,100})$/.exec(req.url);
      if (!match) return json(res, 404, { error: 'Unknown library endpoint.' });
      await catalog();
      if (!allowedItems.has(match[1])) return json(res, 404, { error: 'Cover is not in the configured library.' });
      const response = await upstream(`/api/items/${match[1]}/cover?width=400&format=webp`);
      const contentType = response.headers.get('content-type')?.split(';')[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) throw new Error('cover');
      if (Number(response.headers.get('content-length')) > MAX_IMAGE_BYTES) throw new Error('cover');
      const reader = response.body.getReader(), chunks = []; let size = 0;
      while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > MAX_IMAGE_BYTES) { await reader.cancel(); throw new Error('cover'); } chunks.push(Buffer.from(value)); }
      res.statusCode = 200; res.setHeader('Content-Type', contentType); res.end(Buffer.concat(chunks));
    } catch {
      // Never return upstream responses, credentials, tokens or filesystem paths.
      json(res, 502, { error: 'Could not read Audiobookshelf. Check the server connection and account access.' });
    }
  }
  return { middleware };
}
export function audiobookshelfPlugin(env) {
  const { middleware } = createAbsGateway(env);
  return { name: 'virtual-library-audiobookshelf', configureServer(server) { server.middlewares.use(middleware); }, configurePreviewServer(server) { server.middlewares.use(middleware); } };
}
