import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHELF_CAPACITY, BOOKS_PER_BAY, shelfBookIndex, shelfLocation } from '../src/books/shelf-layout.ts';
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
  assert.equal(galleries.size,6);
  assert.equal(shelfBookIndex(-1,828,0),undefined);assert.equal(shelfBookIndex(0,0,0),undefined);assert.equal(shelfBookIndex(0,12,1),undefined);
});

test('find on shelf locates every item on the right physical page and bay',()=>{
  for(let index=0;index<828;index++){
    const position=shelfLocation(index,828)!;
    assert.ok(position.bay>=0&&position.bay<6);assert.ok(position.column>=0&&position.column<12);
    const slot=position.bay*BOOKS_PER_BAY+(position.side===1?48:0)+position.row*12+position.column;
    assert.equal(shelfBookIndex(slot,828,position.page),index);
  }
  assert.equal(shelfLocation(828,828),undefined);
});
