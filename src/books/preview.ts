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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x201c19);
scene.fog = new THREE.Fog(0x201c19, 12, 35);
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.2, 8.7);
camera.lookAt(0, 2.0, 0);
scene.add(new THREE.HemisphereLight(0xffe9c5, 0x3d302b, 2.2));
const lamp = new THREE.PointLight(0xffdb99, 60, 20);
lamp.position.set(1, 5, 4); scene.add(lamp);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshStandardMaterial({ color: 0x554536, roughness: 0.9 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -0.1; scene.add(floor);
const back = new THREE.Mesh(new THREE.BoxGeometry(22, 8, 0.25), new THREE.MeshStandardMaterial({ color: 0x786249 }));
back.position.set(0, 3.5, -2.2); scene.add(back);

const wood = new THREE.MeshStandardMaterial({ color: 0x704b2f, roughness: 0.8 });
for (let row = 0; row < 3; row++) {
  const board = new THREE.Mesh(new THREE.BoxGeometry(12, 0.14, 1.2), wood);
  board.position.set(0, 0.56 + row * 1.48, -1.45); scene.add(board);
}
for (const x of [-6, 6]) {
  const support = new THREE.Mesh(new THREE.BoxGeometry(0.17, 5.5, 1.25), wood);
  support.position.set(x, 2.5, -1.5); scene.add(support);
}
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

DEMO_BOOKS.forEach((book, index) => {
  const row = Math.floor(index / 4), col = index % 4;
  const width = 0.58 + (index % 3) * 0.08;
  const bookGeometry = new THREE.BoxGeometry(width, 1.24, 0.42);
  const color = palette[index];
  const spine = new THREE.MeshStandardMaterial({ map: spineTexture(book, color), roughness: 0.85 });
  const cover = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.8 });
  const pages = new THREE.MeshStandardMaterial({ color: 0xe2d7ba });
  const mesh = new THREE.Mesh(bookGeometry, [pages, pages, pages, pages, spine, cover]);
  mesh.position.set(-3.8 + col * 2.45, 1.25 + row * 1.48, -1.17);
  mesh.rotation.z = (index % 3 - 1) * 0.018;
  mesh.userData.bookIndex = index;
  scene.add(mesh); selectable.push(mesh);
});

function inspect(book: Book): void {
  info.replaceChildren();
  const genre = document.createElement('p'); genre.textContent = book.genres.join(' · ');
  const title = document.createElement('h2'); title.textContent = book.title;
  const author = document.createElement('p'); author.textContent = `by ${bookDisplayAuthor(book)}`;
  const description = document.createElement('p'); description.textContent = book.description || '';
  const formats = document.createElement('p'); formats.textContent = `Available formats: ${formatsForBook(book).join(', ').toUpperCase()}`;
  info.append(genre, title, author, description, formats);
  details.hidden = false;
}
renderer.domElement.addEventListener('click', event => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(selectable)[0];
  if (hit) inspect(DEMO_BOOKS[hit.object.userData.bookIndex as number]);
});
document.querySelector<HTMLButtonElement>('#close')!.addEventListener('click', () => { details.hidden = true; });
let targetX = 0;
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') details.hidden = true;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') targetX = Math.max(-3, targetX - 0.5);
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') targetX = Math.min(3, targetX + 0.5);
});
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
function animate(): void {
  camera.position.x += (targetX - camera.position.x) * 0.08;
  camera.lookAt(camera.position.x * 0.6, 2.1, 0);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
