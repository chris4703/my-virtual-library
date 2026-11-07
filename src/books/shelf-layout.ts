import { BAYS } from './walk.ts';
export const COLUMNS_PER_SHELF = 5;
export const ROWS_PER_SIDE = 4;
export const BOOKS_PER_SIDE = COLUMNS_PER_SHELF * ROWS_PER_SIDE;
export const BOOKS_PER_BAY = BOOKS_PER_SIDE * 2;
export const bookColumnX = (column:number):number => -1.92 + column * .96;
export const SHELF_CAPACITY = BOOKS_PER_BAY * BAYS.length;
/** Spread a partial last page across the whole room instead of leaving entire bays empty. */
export function shelfBookIndex(slot:number,count:number,page:number):number|undefined {
  if(!Number.isInteger(slot)||slot<0||slot>=SHELF_CAPACITY||count<=0||page<0)return undefined;
  const start=page*SHELF_CAPACITY,visible=Math.min(SHELF_CAPACITY,count-start);
  if(visible<=0)return undefined;
  const before=Math.floor(slot*visible/SHELF_CAPACITY),after=Math.floor((slot+1)*visible/SHELF_CAPACITY);
  return after>before ? start+before : undefined;
}

export function shelfLocation(index:number,count:number):{page:number;bay:number;side:number;row:number;column:number}|undefined {
  if(!Number.isInteger(index)||index<0||index>=count)return undefined;
  const page=Math.floor(index/SHELF_CAPACITY);
  for(let slot=0;slot<SHELF_CAPACITY;slot++)if(shelfBookIndex(slot,count,page)===index){
    const local=slot%BOOKS_PER_BAY;
    return {page,bay:Math.floor(slot/BOOKS_PER_BAY),side:local<BOOKS_PER_SIDE?-1:1,row:Math.floor((local%BOOKS_PER_SIDE)/COLUMNS_PER_SHELF),column:local%COLUMNS_PER_SHELF};
  }
  return undefined;
}
