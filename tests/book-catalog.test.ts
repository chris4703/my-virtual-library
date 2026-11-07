import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Book } from '../src/books/catalog.ts';
import { scopedBookId, formatsForBook, bookDisplayAuthor, sortBooksForShelf } from '../src/books/catalog.ts';

const book = (id: string, title: string): Book => ({
  id,
  sourceId: 'demo',
  title,
  authors: [],
  genres: [],
  editions: [],
});

test('source-scoped IDs distinguish collisions and delimiters', () => {
  assert.notEqual(scopedBookId('server-1', '42'), scopedBookId('server-2', '42'));
  assert.notEqual(scopedBookId('a:b', 'c'), scopedBookId('a', 'b:c'));
  assert.throws(() => scopedBookId(' ', '12'));
  assert.throws(() => scopedBookId('demo', ''));
});

test('books may have ebook and audio editions without relying on ISBN', () => {
  const mixed: Book = {
    ...book('demo:1', 'Book One'),
    editions: [
      { id: 'ed-1', bookId: 'demo:1', format: 'epub', sourceItemId: 'epub-1' },
      { id: 'ed-2', bookId: 'demo:1', format: 'm4b', sourceItemId: 'audio-1' },
      { id: 'ed-3', bookId: 'demo:1', format: 'epub', sourceItemId: 'epub-2' },
    ],
  };
  assert.deepEqual(formatsForBook(mixed), ['epub', 'm4b']);
  assert.equal(mixed.isbn, undefined);
});

test('unknown authors and multiple authors display consistently', () => {
  assert.equal(bookDisplayAuthor(book('1', 'Untitled')), 'Unknown author');
  assert.equal(bookDisplayAuthor({ ...book('2', 'Anthology'), authors: [{ name: 'Ada' }, { name: 'Grace' }] }), 'Ada, Grace');
});

test('shelf ordering ignores leading articles and does not mutate input', () => {
  const source = [book('3', 'The Zebra'), book('1', 'A River'), book('2', 'Blue Sky')];
  assert.deepEqual(sortBooksForShelf(source).map(b => b.title), ['Blue Sky', 'A River', 'The Zebra']);
  assert.equal(source[0].title, 'The Zebra');
});
