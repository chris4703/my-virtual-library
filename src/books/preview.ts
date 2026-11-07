import { BAYS, stepPosition } from './walk.ts';
import * as THREE from 'three';
import { DEMO_BOOKS } from './demo.ts';
import { bookDisplayAuthor, formatsForBook, type Book } from './catalog.ts';

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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x26352e);
scene.fog = new THREE.Fog(0x26352e, 16, 42);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 70);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.75, 10.5);
scene.add(new THREE.HemisphereLight(0xffedcf, 0x354637, 2.2));
const wood = new THREE.MeshStandardMaterial({ color: 0x68452d, roughness: .7 });
const darkWood = new THREE.MeshStandardMaterial({ color: 0x352a20, roughness: .8 });
const brass = new THREE.MeshStandardMaterial({ color: 0xb89a57, metalness: .65, roughness: .35 });
function box(w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); scene.add(mesh); return mesh;
}
const wall = new THREE.MeshStandardMaterial({ color: 0x4c6354, roughness: 1 });
box(24, .2, 25, 0, -.12, 1, darkWood);
// Alternating timber boards, wainscoting and ceiling beams give the room scale.
const floorTones = [0x88704e, 0x927b58, 0x796345].map(color => new THREE.MeshStandardMaterial({color, roughness:.85}));
for (let x = -11.75; x < 12; x += .5) for (let z = -10.5; z < 13; z += 3) {
  box(.485, .035, 2.98, x, .005, z, floorTones[Math.abs(Math.round(x * 2 + z)) % 3]);
}
box(24, 6, .25, 0, 3, -11, wall);
for (const x of [-12, 12]) {
  box(.25, 6, 25, x, 3, 1, wall);
  box(.3, 1.1, 25, x, .55, 1, darkWood);
  box(.35, .07, 25, x, 1.12, 1, brass);
}
box(24, 1.1, .3, 0, .55, -10.8, darkWood);
box(24, .07, .35, 0, 1.12, -10.8, brass);
const ceiling = new THREE.MeshStandardMaterial({color:0xb6ad90, roughness:1});
box(24, .15, 25, 0, 6, 1, ceiling);
for (const z of [-8, -2, 4, 10]) box(24, .25, .23, 0, 5.85, z, darkWood);
function sign(text: string, width: number, x: number, y: number, z: number): void {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 180;
  const ctx = c.getContext('2d')!; ctx.fillStyle = '#183b32'; ctx.fillRect(0,0,1024,180);
  ctx.strokeStyle = '#c1a46b'; ctx.lineWidth=5; ctx.strokeRect(12,12,1000,156);
  ctx.fillStyle='#ead8ac'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='52px Georgia'; ctx.fillText(text,512,94,950);
  const t = new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width,width*180/1024),new THREE.MeshBasicMaterial({map:t}));
  m.position.set(x,y,z); scene.add(m);
}
sign('THE READING ROOM', 8, 0, 4.65, -10.6);
sign('Discover a world between the pages', 6, 0, 3.6, -10.6);
for (const x of [-8, 8]) {
  box(3.2, 2.5, .15, x, 3.3, -10.7, brass);
  box(3, 2.3, .18, x, 3.3, -10.55, new THREE.MeshBasicMaterial({color:0xabc6b2}));
  box(.08, 2.3, .2, x, 3.3, -10.4, darkWood);
  box(3,.08,.2,x,3.3,-10.4,darkWood);
}
for (const x of [-6.5,0,6.5]) for (const z of [-5, 1, 8]) {
  box(.05,1,.05,x,5.3,z,brass);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.65,.35,24,1,true),brass); shade.position.set(x,4.8,z); scene.add(shade);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),new THREE.MeshBasicMaterial({color:0xffe3a0})); bulb.position.set(x,4.6,z); scene.add(bulb);
  const light=new THREE.PointLight(0xffdf9c,18,9,2); light.position.set(x,4.45,z); scene.add(light);
}
// A reading lounge at the rear, outside the walking routes between shelves.
const fabric=new THREE.MeshStandardMaterial({color:0x9a6240,roughness:1});
for (const x of [-7,7]) {
  box(2.1,.4,1.8,x,.5,-8.7,fabric); box(2.1,1.2,.35,x,1,-9.4,fabric);
  for(const side of [-1,1]) box(.28,.65,1.8,x+side,.85,-8.7,fabric);
  box(1.3,.1,1,x+2.2,.7,-8.7,wood); box(.15,.7,.15,x+2.2,.3,-8.7,brass);
}
const rug = new THREE.MeshStandardMaterial({color:0x415d50,roughness:1});
box(9,.025,2.8,0,.04,8.5,rug);
for(const x of [-4.3,4.3]) box(.07,.028,2.6,x,.055,8.5,brass);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const selectable: THREE.Mesh[] = [];
const palette = ['#395c56','#a15b42','#354961','#806c4e','#6a4c61','#877c51','#416e69','#9c6950','#4f5e85','#82643c','#647355','#7e4b51'];

function spineTexture(book: Book, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 1024);
  ctx.fillStyle = '#ead9af'; ctx.fillRect(18, 30, 220, 3); ctx.fillRect(18, 990, 220, 3);
  ctx.save(); ctx.translate(128, 512); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff2d6';
  ctx.font = 'bold 58px Georgia, serif';
  const words = book.title.toUpperCase();
  const shrink = Math.min(1, 850 / Math.max(1, ctx.measureText(words).width));
  ctx.scale(shrink, 1); ctx.fillText(words, 0, 0);
  ctx.restore();
  ctx.fillStyle = '#f5e4bb'; ctx.font = '22px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(bookDisplayAuthor(book).slice(0, 20), 128, 942);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const spineMaterials = DEMO_BOOKS.map((book,i)=>new THREE.MeshStandardMaterial({map:spineTexture(book,palette[i]),roughness:.85}));
const pages = new THREE.MeshStandardMaterial({color:0xe2d7ba,roughness:1});
BAYS.forEach((bay,bayIndex)=> {
  box(5.1,3.65,.16,bay.x,1.85,bay.z,wood);
  for(const side of [-1,1]) box(.14,3.85,1.3,bay.x+side*2.5,1.9,bay.z,wood);
  for(let row=0;row<4;row++) box(5.1,.12,1.3,bay.x,.18+row*.93,bay.z,wood);
  box(5.3,.16,1.4,bay.x,3.85,bay.z,darkWood);
  sign(['IMAGINATION','WORLDS BEYOND','MYSTERY & WONDER','NATURE & LIFE','STORIES TO KEEP','THE DISCOVERY SHELF'][bayIndex],4,bay.x,4.2,bay.z+.08);
  for(const side of [-1,1]) for(let row=0;row<4;row++) for(let col=0;col<12;col++) {
    const index=(bayIndex*5+row*3+col)%DEMO_BOOKS.length;
    const height=.58+(index%4)*.065;
    const cover = new THREE.MeshStandardMaterial({color:palette[index],roughness:.8});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.28+(index%3)*.035,height,.48),[cover,cover,pages,pages,spineMaterials[index],spineMaterials[index]]);
    mesh.position.set(bay.x-2.18+col*.39,.24+row*.93+height/2,bay.z+side*.37);
    mesh.userData.bookIndex=index; scene.add(mesh); selectable.push(mesh);
  }
});

const browse=document.querySelector<HTMLElement>('#browse')!;
const search=document.querySelector<HTMLInputElement>('#search')!;
const hint=document.querySelector<HTMLElement>('#hint')!;
let previousFocus: HTMLElement | null = null;
function closeDetails():void { details.hidden=true; if(previousFocus?.offsetParent)previousFocus.focus(); else renderer.domElement.focus(); }
function inspect(book: Book): void {
  previousFocus=document.activeElement as HTMLElement;
  browse.hidden=true; info.replaceChildren();
  const cover=document.createElement('div'); cover.className='cover'; cover.textContent=book.title;
  const genre=document.createElement('span'); genre.className='eyebrow'; genre.textContent=book.genres.join(' · ');
  const title=document.createElement('h2'); title.textContent=book.title;
  const author=document.createElement('p'); author.textContent=`by ${bookDisplayAuthor(book)}`;
  const description=document.createElement('p'); description.textContent=book.description || 'No description available.';
  const formats=document.createElement('div');
  formatsForBook(book).forEach(format=>{const tag=document.createElement('span');tag.className='tag';tag.textContent=format==='m4b'?'Audiobook · M4B':`E-book · ${format.toUpperCase()}`;formats.append(tag);});
  const notice=document.createElement('p');notice.id='notice';notice.textContent='An original sample title. Connect your library in a future update to read or listen to your own books.';
  info.append(genre,cover,title,author,description,formats,notice);details.hidden=false;document.querySelector<HTMLButtonElement>('#close')!.focus();
}
function renderCatalog():void {
  const query=search.value.toLocaleLowerCase().trim();
  const books=DEMO_BOOKS.filter(b=>[b.title,bookDisplayAuthor(b),...b.genres].join(' ').toLocaleLowerCase().includes(query));
  document.querySelector('#count')!.textContent=`${books.length} ${books.length===1?'title':'titles'}${books.length?'':' · try another search'}`;
  const results=document.querySelector('#results')!;results.replaceChildren();
  books.forEach(book=>{const li=document.createElement('li'),button=document.createElement('button'),label=document.createElement('small');button.className='book-row';button.textContent=book.title;label.textContent=`${bookDisplayAuthor(book)} · ${book.genres.join(', ')}`;button.append(label);button.addEventListener('click',()=>inspect(book));li.append(button);results.append(li);});
}
search.addEventListener('input',renderCatalog);renderCatalog();
document.querySelector('#catalog')!.addEventListener('click',()=>{details.hidden=true;browse.hidden=!browse.hidden;if(!browse.hidden)search.focus();});
document.querySelector('#close-browse')!.addEventListener('click',()=>{browse.hidden=true;document.querySelector<HTMLButtonElement>('#catalog')!.focus();});
document.querySelector('#close')!.addEventListener('click',closeDetails);
let yaw=0,pitch=0;
const keys=new Set<string>();
function reset():void{camera.position.set(0,1.75,10.5);yaw=0;pitch=0;keys.clear();renderer.domElement.focus();}
document.querySelector('#home')!.addEventListener('click',reset);
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'){closeDetails();browse.hidden=true;keys.clear();}
  if(event.target instanceof HTMLInputElement)return;
  if(!details.hidden || !browse.hidden)return;
  if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();keys.add(event.key);}
});
window.addEventListener('keyup',event=>keys.delete(event.key));window.addEventListener('blur',()=>keys.clear());
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
  yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-.65,.65);
});
renderer.domElement.addEventListener('pointercancel',()=>{drag=null;});
renderer.domElement.addEventListener('pointerup',event=>{
  if(drag && drag.distance<8){
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(selectable)[0];if(hit && hit.distance<8)inspect(DEMO_BOOKS[hit.object.userData.bookIndex as number]);
  }drag=null;
});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
let last=performance.now();
function animate(now:number):void {
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(details.hidden && browse.hidden){
    yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.5;
    let forward=(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0);
    let side=(keys.has('d')?1:0)-(keys.has('a')?1:0);
    const length=Math.hypot(forward,side)||1;forward/=length;side/=length;
    const pos=stepPosition(camera.position.x,camera.position.z,(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*dt*3,(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*dt*3);
    camera.position.x=pos.x;camera.position.z=pos.z;
  }else keys.clear();
  camera.rotation.set(pitch,yaw,0);
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hit=raycaster.intersectObjects(selectable)[0];
  hint.textContent=hit && hit.distance<8?`${DEMO_BOOKS[hit.object.userData.bookIndex as number].title} · click to inspect`:'Explore the aisles · browse the collection to find a title';
  renderer.render(scene,camera);
}
renderer.setAnimationLoop(animate);
