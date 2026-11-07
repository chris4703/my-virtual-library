import type { Book } from './catalog.ts';
import { scopedBookId } from './catalog.ts';

/** Original fictional titles: no copyrighted media or cover images are bundled. */
const sample = [
  ['The Clockwork Orchard', 'Mira Vale', 'Fantasy', 'A mechanical garden awakens when its keeper discovers a forgotten season.', ['epub', 'm4b']],
  ['Letters from the Tides', 'Elian Shore', 'Literary Fiction', 'A collection of letters traces a family across a shifting coastline.', ['epub']],
  ['A Map of Small Wonders', 'Tessa Finch', 'Adventure', 'A cartographer records places that disappear from ordinary maps.', ['epub', 'm4b']],
  ['The Midnight Observatory', 'Rowan Hale', 'Science Fiction', 'An amateur astronomer discovers an impossible signal.', ['m4b']],
  ['Beneath the Copper Sky', 'Nora Ash', 'Mystery', 'A quiet town holds the answer to a decades-old disappearance.', ['epub']],
  ['The Glass River', 'Iris North', 'Fantasy', 'An apprentice glassmaker learns to shape reflections.', ['epub', 'm4b']],
  ['Seeds of Tomorrow', 'Ada Brooks', 'Nature', 'A field journal about the future of a changing landscape.', ['epub']],
  ['The Last Lantern Keeper', 'Evan Reed', 'Adventure', 'A lighthouse keeper must guide ships through an unfamiliar sea.', ['m4b']],
  ['A Study in Starlight', 'Lena Frost', 'Science Fiction', 'Researchers study stars that appear only at dawn.', ['epub']],
  ['The Paper Door', 'Sage Mercer', 'Mystery', 'A bookbinder finds a mysterious doorway inside an old manuscript.', ['epub', 'm4b']],
  ['Wildflower Season', 'Mae Ellis', 'Literary Fiction', 'A gardener returns home to uncover a family story.', ['epub']],
  ['Echoes of the Library', 'Theo Wren', 'Fantasy', 'Every shelf in a peculiar library leads to another world.', ['epub', 'm4b']],
] as const;

export const DEMO_BOOKS: Book[] = sample.map(([title, author, genre, description, formats], i) => {
  const id = scopedBookId('demo', String(i + 1));
  return {
    id,
    sourceId: 'demo',
    title,
    description,
    authors: [{ name: author }],
    genres: [genre],
    editions: formats.map((format, index) => ({
      id: scopedBookId('demo', `${i + 1}-edition-${index + 1}`),
      bookId: id,
      format,
      sourceItemId: `sample-${i + 1}-${index + 1}`,
    })),
  };
});
