import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canStand, stepPosition } from '../src/books/walk.ts';
test('central aisle and entrance are walkable, while shelves and walls are solid',()=>{
  assert.equal(canStand(0,10),true);assert.equal(canStand(0,-5),true);
  assert.equal(canStand(9,8),false);assert.equal(canStand(-9,-6),false);assert.equal(canStand(16,0),false);
});
test('long movement cannot tunnel through shelves and slides along their front',()=>{
  const stopped=stepPosition(9,20,0,-32);assert.ok(stopped.z>16);
  const slide=stepPosition(9,16.2,1,-1);assert.ok(slide.x>9.9);assert.ok(slide.z>16);
});
test('reading chairs and table have collision, and the lounge remains reachable',()=>{
  assert.equal(canStand(2.3,-8.5),false);assert.equal(canStand(0,-8.25),false);
  assert.equal(canStand(0,-6.8),true);assert.equal(canStand(4.2,-8.5),true);
});
