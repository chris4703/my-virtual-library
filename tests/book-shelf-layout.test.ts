import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHELF_CAPACITY, BOOKS_PER_BAY, BOOKS_PER_SIDE, COLUMNS_PER_SHELF, shelfBookIndex, shelfLocation } from '../src/books/shelf-layout.ts';
import { BAYS } from '../src/books/walk.ts';
test('all source items appear exactly once across shelf pages',()=>{
  for(const count of [1,12,576,577,828,1500]){
    const seen:number[]=[];
    for(let page=0;page<Math.ceil(count/SHELF_CAPACITY);page++)for(let slot=0;slot<SHELF_CAPACITY;slot++){
      const index=shelfBookIndex(slot,count,page);if(index!==undefined)seen.push(index);
    }
    assert.deepEqual(seen,Array.from({length:count},(_,index)=>index));
  }
});
test('partial pages are spread across all galleries',()=>{
  const galleries=new Set<number>();
  for(let slot=0;slot<SHELF_CAPACITY;slot++)if(shelfBookIndex(slot,828,1)!==undefined)galleries.add(Math.floor(slot/BOOKS_PER_BAY));
  assert.equal(galleries.size,BAYS.length);
  assert.equal(shelfBookIndex(-1,828,0),undefined);assert.equal(shelfBookIndex(0,0,0),undefined);assert.equal(shelfBookIndex(0,12,1),undefined);
});

test('find on shelf locates every item on the right physical page and bay',()=>{
  for(let index=0;index<828;index++){
    const position=shelfLocation(index,828)!;
    assert.ok(position.bay>=0&&position.bay<BAYS.length);assert.ok(position.column>=0&&position.column<COLUMNS_PER_SHELF);
    const slot=position.bay*BOOKS_PER_BAY+(position.side===1?BOOKS_PER_SIDE:0)+position.row*COLUMNS_PER_SHELF+position.column;
    assert.equal(shelfBookIndex(slot,828,position.page),index);
  }
  assert.equal(shelfLocation(828,828),undefined);
});

test('cover display locations leave a walkable inspection point on both sides of every gallery',async()=>{
  const { canStand }=await import('../src/books/walk.ts');
  const { bookColumnX }=await import('../src/books/shelf-layout.ts');
  for(let index=0;index<828;index++){
    const location=shelfLocation(index,828)!,bay=BAYS[location.bay];
    assert.ok(canStand(bay.x+bookColumnX(location.column),bay.z+location.side*2.2),`book ${index} must be reachable`);
  }
});
