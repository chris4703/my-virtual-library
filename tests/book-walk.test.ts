import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canStand, stepPosition } from '../src/books/walk.ts';
test('library entrance and aisles are walkable, walls and shelves are solid', () => {
  assert.equal(canStand(0, 10), true);
  assert.equal(canStand(3.25, -5), true);
  assert.equal(canStand(0, -5), false);
  assert.equal(canStand(12, 0), false);
});
test('long movement cannot tunnel through a shelf and can slide along it', () => {
  const stopped = stepPosition(0, 4, 0, -12);
  assert.ok(stopped.z > 2);
  const slide = stepPosition(0, 2.1, 1, -1);
  assert.ok(slide.x > .9);
  assert.ok(slide.z > 2);
});
