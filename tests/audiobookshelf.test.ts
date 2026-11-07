import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAbsBook } from '../src/books/audiobookshelf.ts';
import { createAbsGateway } from '../tools/audiobookshelf.mjs';
const libraryId = 'fictional-library';
const item = (id = 'sample-1') => ({ id, libraryId, mediaType: 'book', path: '/private/collection', media: { numAudioFiles: 2, duration: 7200, ebookFormat: 'epub', coverPath: '/private/cover.jpg', metadata: { title: 'A Sample Story', authorName: 'A Writer', narratorName: 'A Reader', genres: ['Fiction'], description: '<p>A story &amp; an adventure.</p>', publishedYear: '2024', series: [{ name: 'Sample Series', sequence: '1.5' }] } } });
const config = { MVL_ABS_URL: 'https://books.example/abs', MVL_ABS_LIBRARY_ID: libraryId, MVL_ABS_USERNAME: 'sample', MVL_ABS_PASSWORD: 'test-only-password' };
async function request(gateway: ReturnType<typeof createAbsGateway>, url: string, method = 'GET', headers = {}) {
  const result = { statusCode: 200, headers: {} as Record<string, string>, body: '' };
  const res = { set statusCode(value: number) { result.statusCode = value; }, setHeader(key: string, value: string) { result.headers[key] = value; }, end(body: string | Buffer) { result.body = String(body); } };
  await gateway.middleware({ url, method, headers: { host: 'preview.example', ...headers } }, res, () => { result.statusCode = 404; });
  return result;
}
test('normalizes Audiobookshelf metadata and strips private fields', () => {
  const book = normalizeAbsBook(item())!;
  assert.equal(book.title, 'A Sample Story'); assert.equal(book.authors[0].name, 'A Writer');
  assert.deepEqual(book.narrators, ['A Reader']); assert.equal(book.series?.index, 1.5);
  assert.equal(book.description, 'A story & an adventure.'); assert.equal(book.editions[0].durationSeconds, 7200);
  assert.deepEqual(book.editions.map(e => e.format), ['other-audio', 'epub']);
  assert.equal(JSON.stringify(book).includes('/private'), false);
  assert.equal(normalizeAbsBook({ ...item(), id: '../other' }), null);
  assert.equal(normalizeAbsBook({ ...item(), isMissing: true }), null);
  assert.equal(normalizeAbsBook({ ...item(), mediaType: 'podcast' }), null);
});
test('handles missing artwork, metadata and non-audio books without inventing editions', () => {
  const book = normalizeAbsBook({ id: 'book-2', mediaType: 'book', media: { metadata: { title: 'Minimal' } } })!;
  assert.deepEqual(book.authors, []); assert.deepEqual(book.editions, []); assert.equal(book.coverId, undefined);
  assert.equal(normalizeAbsBook(null), null);
});
test('paginates a fixed library, sanitizes payloads and caches catalog without sharing tokens', async () => {
  const paths: string[] = [];
  const gateway = createAbsGateway(config, async (url: string, options: RequestInit) => {
    paths.push(url);
    if (url.endsWith('/login')) { assert.equal(new Headers(options.headers).get('Origin'), 'https://books.example'); return Response.json({ user: { accessToken: 'test-only-access' } }); }
    assert.equal(new Headers(options.headers).get('Authorization'), 'Bearer test-only-access');
    const page = new URL(url).searchParams.get('page');
    return Response.json({ total: 101, results: page === '0' ? [item(), { ...item('not-allowed'), libraryId: 'different' }] : [item('sample-2')] });
  });
  const result = await request(gateway, '/__library/catalog');
  assert.equal(result.statusCode, 200); const data = JSON.parse(result.body); assert.equal(data.books.length, 2);
  assert.equal(result.body.includes('test-only'), false); assert.equal(result.body.includes('/private'), false);
  assert.equal(result.headers['Cache-Control'], 'private, no-store');
  await request(gateway, '/__library/catalog'); assert.equal(paths.length, 3);
});
test('denies writes, cross-site origins, unknown paths and covers from other libraries', async () => {
  let calls = 0;
  const gateway = createAbsGateway(config, async (url: string) => { calls++; return url.endsWith('/login') ? Response.json({ user: { accessToken: 'test' } }) : Response.json({ total: 1, results: [item()] }); });
  assert.equal((await request(gateway, '/__library/catalog', 'POST')).statusCode, 405);
  assert.equal((await request(gateway, '/__library/catalog', 'GET', { origin: 'https://evil.example' })).statusCode, 403);
  assert.equal((await request(gateway, '/__library/catalog', 'GET', { 'sec-fetch-site': 'cross-site' })).statusCode, 403);
  assert.equal((await request(gateway, '/__library/proxy?url=https://evil.example')).statusCode, 404); assert.equal(calls, 0);
  assert.equal((await request(gateway, '/__library/cover/not-allowed')).statusCode, 404); assert.equal(calls, 2);
});
test('re-authenticates once on expiry and never sends upstream errors to the browser', async () => {
  let logins = 0, gets = 0;
  const gateway = createAbsGateway(config, async (url: string) => {
    if (url.endsWith('/login')) { logins++; return Response.json({ user: { accessToken: 'test' } }); }
    gets++; return gets === 1 ? new Response('', { status: 401 }) : Response.json({ total: 1, results: [item()] });
  });
  assert.equal((await request(gateway, '/__library/catalog')).statusCode, 200); assert.equal(logins, 2);
  const failed = createAbsGateway(config, async () => { throw new Error('private secret'); });
  const result = await request(failed, '/__library/catalog'); assert.equal(result.statusCode, 502); assert.equal(result.body.includes('private secret'), false);
});
test('only serves safe image bytes for covers belonging to the configured library', async () => {
  const gateway = createAbsGateway(config, async (url: string) => {
    if (url.endsWith('/login')) return Response.json({ user: { accessToken: 'test' } });
    if (url.includes('/cover?')) return new Response('<svg/>', { headers: { 'Content-Type': 'image/svg+xml' } });
    return Response.json({ total: 1, results: [item()] });
  });
  assert.equal((await request(gateway, '/__library/cover/sample-1')).statusCode, 502);
  assert.equal((await request(createAbsGateway({}), '/__library/catalog')).statusCode, 503);
});
test('renews expired access with a rotating refresh token instead of repeated password logins', async () => {
  const paths: string[] = []; let reads = 0;
  const gateway = createAbsGateway(config, async (url: string, options: RequestInit) => {
    paths.push(new URL(url).pathname);
    if (url.endsWith('/login')) return Response.json({ user: { accessToken: 'first', refreshToken: 'refresh-one' } });
    if (url.endsWith('/auth/refresh')) {
      assert.equal(new Headers(options.headers).get('x-refresh-token'), 'refresh-one');
      return Response.json({ user: { accessToken: 'second', refreshToken: 'refresh-two' } });
    }
    if (++reads === 1) return new Response('', {status:401});
    assert.equal(new Headers(options.headers).get('Authorization'), 'Bearer second');
    return Response.json({total:1,results:[item()]});
  });
  assert.equal((await request(gateway, '/__library/catalog')).statusCode, 200);
  assert.equal(paths.filter(p => p.endsWith('/login')).length, 1);
  assert.equal(paths.filter(p => p.endsWith('/auth/refresh')).length, 1);
});
test('preserves simultaneous ebook and audio availability, including MOBI, and narrator lists', () => {
  const value = item(); value.media.ebookFormat = 'mobi'; value.media.metadata.narratorName = 'Reader One, Reader Two';
  const book = normalizeAbsBook(value)!;
  assert.deepEqual(book.editions.map(e => e.format), ['other-audio', 'mobi']);
  assert.ok(book.editions.every(e => e.sourceItemId === value.id));
  assert.deepEqual(book.narrators, ['Reader One', 'Reader Two']);
  value.media.ebookFormat = 'future-format';
  assert.equal(normalizeAbsBook(value)!.editions[1].format, 'other-ebook');
});
