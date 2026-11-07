/**
 * Provider-neutral library model. No imports from movie catalogs or rendering code.
 * IDs are stable and source-scoped; ISBNs and other identifiers are optional.
 */

export type BookFormat = 'epub' | 'pdf' | 'm4b' | 'mp3' | 'other-audio';

export interface BookAuthor {
  id?: string;
  name: string;
}

export interface BookSeries {
  name: string;
  /** May be fractional (e.g. a novella between volumes). */
  index?: number;
}

export interface BookEdition {
  /** Unique within the normalized catalog. */
  id: string;
  bookId: string;
  format: BookFormat;
  /** A source-relative locator, never an access token or public download URL. */
  sourceItemId: string;
  language?: string;
  durationSeconds?: number;
  sizeBytes?: number;
}

export interface Book {
  id: string;
  sourceId: string;
  title: string;
  subtitle?: string;
  description?: string;
  authors: BookAuthor[];
  series?: BookSeries;
  genres: string[];
  publicationYear?: number;
  language?: string;
  /** ISBN may be absent or reused across files; never a primary key. */
  isbn?: string;
  /** Resolved by an adapter, not treated as a trusted arbitrary URL. */
  coverId?: string;
  editions: BookEdition[];
}

export interface BookCollection {
  id: string;
  name: string;
  bookIds: string[];
}

/** Avoid collision between similarly numbered items from different providers. */
export function scopedBookId(sourceId: string, itemId: string): string {
  if (!sourceId.trim() || !itemId.trim()) throw new Error('Source and item IDs must not be blank');
  return `${encodeURIComponent(sourceId)}:${encodeURIComponent(itemId)}`;
}

export function formatsForBook(book: Book): BookFormat[] {
  return [...new Set(book.editions.map(edition => edition.format))];
}

export function bookDisplayAuthor(book: Book): string {
  return book.authors.map(author => author.name.trim()).filter(Boolean).join(', ') || 'Unknown author';
}

/** Sort for consistent spine placement, without mutating the source catalog. */
export function sortBooksForShelf(books: readonly Book[]): Book[] {
  const key = (value: string) => value.replace(/^(a|an|the)\s+/i, '').trim();
  return [...books].sort((a, b) =>
    key(a.title).localeCompare(key(b.title), undefined, { sensitivity: 'base' }) ||
    a.title.localeCompare(b.title) ||
    a.id.localeCompare(b.id)
  );
}
