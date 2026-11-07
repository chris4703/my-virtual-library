import { scopedBookId, type Book, type BookEdition, type BookFormat } from './catalog.ts';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const positive = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
export const validAbsId = (id: string): boolean => /^[a-zA-Z0-9_-]{1,100}$/.test(id);

/** Explicit allowlist: credentials, file paths, user data and raw API objects never cross this boundary. */
export function normalizeAbsBook(value: unknown): Book | null {
  const item = record(value), media = record(item.media), metadata = record(media.metadata);
  const itemId = text(item.id), title = text(metadata.title);
  if (!validAbsId(itemId) || !title || item.mediaType !== 'book' || item.isMissing === true || item.isInvalid === true) return null;
  const id = scopedBookId('audiobookshelf', itemId);
  const editions: BookEdition[] = [];
  if ((positive(media.numAudioFiles) ?? 0) > 0 || (positive(media.numTracks) ?? 0) > 0 || (positive(media.duration) ?? 0) > 0) {
    editions.push({ id: scopedBookId('audiobookshelf', `${itemId}-audio`), bookId: id, format: 'other-audio', sourceItemId: itemId, durationSeconds: positive(media.duration) });
  }
  const ebookFormat = text(media.ebookFormat).toLowerCase();
  if (ebookFormat) editions.push({ id: scopedBookId('audiobookshelf', `${itemId}-${ebookFormat}`), bookId: id, format: (['epub','pdf','mobi'].includes(ebookFormat) ? ebookFormat : 'other-ebook') as BookFormat, sourceItemId: itemId });
  const authors = Array.isArray(metadata.authors) ? metadata.authors.map(author => text(record(author).name)).filter(Boolean) : [];
  if (!authors.length && text(metadata.authorName)) authors.push(text(metadata.authorName));
  const series = Array.isArray(metadata.series) ? record(metadata.series[0]) : {};
  const seriesName = text(series.name) || text(metadata.seriesName);
  const sequence = Number(series.sequence);
  const year = Number(metadata.publishedYear);
  const description = text(metadata.description).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return {
    id, sourceId: 'audiobookshelf', sourceItemId: itemId, title, subtitle: text(metadata.subtitle) || undefined,
    authors: authors.map(name => ({ name })),
    genres: Array.isArray(metadata.genres) ? metadata.genres.filter((genre): genre is string => typeof genre === 'string').map(genre => genre.trim()).filter(Boolean) : [],
    description, series: seriesName ? { name: seriesName, index: series.sequence != null && Number.isFinite(sequence) ? sequence : undefined } : undefined,
    publicationYear: Number.isInteger(year) && year > 0 ? year : undefined,
    language: text(metadata.language) || undefined, isbn: text(metadata.isbn) || undefined,
    narrators: Array.isArray(metadata.narrators) ? metadata.narrators.filter((name): name is string => typeof name === 'string') : text(metadata.narratorName) ? text(metadata.narratorName).split(',').map(name => name.trim()).filter(Boolean) : [],
    publisher: text(metadata.publisher) || undefined,
    coverId: text(media.coverPath) ? itemId : undefined, editions,
  };
}
