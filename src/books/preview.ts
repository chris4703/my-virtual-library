import { BAYS, stepPosition } from './walk.ts';
import { readingRoomRenderer } from './rendering.ts';
import { createReadingRoom } from './room.ts';
import { LibraryShelves } from './shelves.ts';
import { SHELF_CAPACITY, shelfLocation, bookColumnX } from './shelf-layout.ts';
import { renderBookDetails } from './inspection.ts';
import { CollectionBrowser } from './browser.ts';
import * as THREE from 'three';
import { DEMO_BOOKS } from './demo.ts';
import { sortBooksForShelf, type Book } from './catalog.ts';

let books = DEMO_BOOKS;
let openBase = '';
let shelfPage = 0;
let renderRequested=true;
let focusedBook:number|undefined;
const container = document.querySelector<HTMLDivElement>('#stage')!;
const details = document.querySelector<HTMLElement>('#details')!;
const info = document.querySelector<HTMLDivElement>('#book-info')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.append(renderer.domElement);
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', 'Library walking view');

const room=createReadingRoom(renderer),scene=room.scene;
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.08,70);
camera.rotation.order='YXZ';camera.position.set(0,1.75,20);
const pipeline=readingRoomRenderer(renderer,scene,camera);
const shelves=new LibraryShelves(room,(shadows)=>{renderRequested=true;if(shadows)renderer.shadowMap.needsUpdate=true;});
renderer.shadowMap.autoUpdate=false;
const raycaster=new THREE.Raycaster();raycaster.far=8;
const pointer=new THREE.Vector2();
function stockShelves():void{
  shelves.stock(books,shelfPage,Boolean(openBase));
  document.querySelector('#collection-label')!.textContent=openBase?`YOUR COLLECTION · ${books.length} TITLES`:'THE READING ROOM · 12 ORIGINAL TITLES';
  const next=document.querySelector<HTMLButtonElement>('#next-shelves')!;
  next.hidden=!openBase||books.length<=SHELF_CAPACITY;
  next.textContent=`Shelves ${shelfPage+1} / ${Math.ceil(books.length/SHELF_CAPACITY)} →`;
}
stockShelves();
document.querySelector('#next-shelves')!.addEventListener('click',()=>{shelfPage=(shelfPage+1)%Math.ceil(books.length/SHELF_CAPACITY);stockShelves();});
const sourceButton=document.querySelector<HTMLButtonElement>('#connect-library')!;
sourceButton.addEventListener('click',async()=>{
  sourceButton.disabled=true;sourceButton.textContent='Loading library…';
  try {
    const response=await fetch('/__library/catalog', {cache:'no-store'});
    if(!response.ok)throw new Error('connection');
    const data=await response.json() as {books:Book[];openBase:string};
    if(!Array.isArray(data.books)||!data.books.length)throw new Error('empty');
    books=sortBooksForShelf(data.books);openBase=data.openBase;shelfPage=0;
    try { localStorage.setItem('mvl-source','audiobookshelf'); } catch { /* Storage may be disabled. */ }
    details.hidden=true;stockShelves();renderCatalog();
    sourceButton.textContent='Refresh Audiobookshelf';document.body.classList.add('connected');
    document.querySelector('#source-notice')!.textContent=`Connected · ${books.length} titles · Open a book in Audiobookshelf to read or listen`;
  }catch{sourceButton.textContent='Retry Audiobookshelf';document.querySelector('#source-notice')!.textContent='Could not load your library. Check the server connection and account access. Your current shelves are still available.';}
  finally{sourceButton.disabled=false;}
});
const browse=document.querySelector<HTMLElement>('#browse')!;
const search=document.querySelector<HTMLInputElement>('#search')!;
const hint=document.querySelector<HTMLElement>('#hint')!;
let previousFocus: HTMLElement | null = null;
function closeDetails():void { details.hidden=true; if(previousFocus?.offsetParent)previousFocus.focus(); else renderer.domElement.focus(); }
function locateBook(book:Book):void{
  const index=books.findIndex(candidate=>candidate.id===book.id);
  const location=shelfLocation(index,books.length);if(!location)return;
  if(openBase&&shelfPage!==location.page){shelfPage=location.page;stockShelves();}
  const bay=BAYS[location.bay];
  camera.position.set(bay.x+bookColumnX(location.column),1.75,bay.z+location.side*2.2);
  yaw=location.side>0?0:Math.PI;pitch=Math.atan2(.62+location.row*.93-1.75,1.8);
  details.hidden=true;browse.hidden=true;keys.clear();renderRequested=true;renderer.domElement.focus();
}
function inspect(book:Book):void{
  previousFocus=document.activeElement as HTMLElement;browse.hidden=true;
  renderBookDetails(info,book,openBase,()=>locateBook(book));details.hidden=false;
  document.querySelector<HTMLButtonElement>('#close')!.focus();info.scrollTop=0;
}
const collection=new CollectionBrowser(inspect);collection.setBooks(books,false);
function renderCatalog():void{collection.setBooks(books,Boolean(openBase));}
document.querySelector('#catalog')!.addEventListener('click',()=>{details.hidden=true;browse.hidden=!browse.hidden;if(!browse.hidden)search.focus();});
document.querySelector('#close-browse')!.addEventListener('click',()=>{browse.hidden=true;document.querySelector<HTMLButtonElement>('#catalog')!.focus();});
document.querySelector('#close')!.addEventListener('click',closeDetails);
let yaw=0,pitch=0;
const keys=new Set<string>();
function reset():void{details.hidden=true;browse.hidden=true;camera.position.set(0,1.75,20);yaw=0;pitch=0;renderRequested=true;keys.clear();renderer.domElement.focus();}
document.querySelector('#home')!.addEventListener('click',reset);
document.querySelector('#reading-nook')!.addEventListener('click',()=>{details.hidden=true;browse.hidden=true;camera.position.set(0,1.75,-6.25);yaw=0;pitch=.05;renderRequested=true;keys.clear();renderer.domElement.focus();});
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'){closeDetails();browse.hidden=true;keys.clear();}
  if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;
  if(!details.hidden || !browse.hidden)return;
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if((key==='Enter'||key==='e')&&focusedBook!==undefined&&event.target===renderer.domElement){event.preventDefault();inspect(books[focusedBook]);}
  if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)){event.preventDefault();keys.add(key);}
});
window.addEventListener('keyup',event=>keys.delete(event.key.length===1?event.key.toLowerCase():event.key));window.addEventListener('blur',()=>keys.clear());
document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.move!);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(button.dataset.move!));
});
let drag: {x:number;y:number;distance:number} | null=null;
renderer.domElement.style.touchAction='none';
renderer.domElement.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,distance:0};renderer.domElement.setPointerCapture(event.pointerId);});
renderer.domElement.addEventListener('pointermove',event=>{
  if(!drag)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  drag.distance+=Math.abs(dx)+Math.abs(dy);drag.x=event.clientX;drag.y=event.clientY;
  yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-.65,.65);renderRequested=true;
});
renderer.domElement.addEventListener('pointercancel',()=>{drag=null;});
renderer.domElement.addEventListener('pointerup',event=>{
  if(drag && drag.distance<8){
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(scene.children,true)[0];const index=hit?shelves.bookIndex(hit):undefined;if(index!==undefined)inspect(books[index]);
  }drag=null;
});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);pipeline.resize();renderRequested=true;});
const stats=new URLSearchParams(location.search).has('stats')?document.createElement('output'):null;
let renderedFrames=0;
if(stats){stats.id='render-stats';stats.setAttribute('aria-label','Renderer statistics');stats.style.cssText='position:fixed;top:125px;left:30px;background:#10271fdd;color:#e9dfbd;padding:10px;font:11px monospace;pointer-events:none';document.body.append(stats);}
let last=performance.now();
function animate(now:number):void {
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(details.hidden && browse.hidden){
    const turning=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0);
    yaw+=turning*dt*1.5;if(turning)renderRequested=true;
    let forward=(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0);
    let side=(keys.has('d')?1:0)-(keys.has('a')?1:0);
    const length=Math.hypot(forward,side)||1;forward/=length;side/=length;
    const pos=stepPosition(camera.position.x,camera.position.z,(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*dt*3,(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*dt*3);
    if(pos.x!==camera.position.x||pos.z!==camera.position.z)renderRequested=true;
    camera.position.x=pos.x;camera.position.z=pos.z;
  }else keys.clear();
  camera.rotation.set(pitch,yaw,0);
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hit=raycaster.intersectObjects(scene.children,true)[0];
  focusedBook=hit?shelves.bookIndex(hit):undefined;
  hint.textContent=focusedBook!==undefined?`${books[focusedBook].title} · click or press E to inspect`:'Walk between the shelves · find a story to get lost in';
  document.querySelector('#reticle')!.classList.toggle('active',focusedBook!==undefined);
  renderer.domElement.style.cursor=focusedBook!==undefined?'pointer':'grab';
  if(renderRequested){pipeline.render();renderRequested=false;renderedFrames++;if(stats)stats.textContent=`Draws ${renderer.info.render.calls} · triangles ${renderer.info.render.triangles} · rendered frames ${renderedFrames}`;}

}
renderer.setAnimationLoop(animate);

try { if(localStorage.getItem('mvl-source')==='audiobookshelf')sourceButton.click(); } catch { /* Manual loading remains available. */ }
