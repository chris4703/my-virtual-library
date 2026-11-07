import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { bookDisplayAuthor, type Book } from './catalog.ts';
import { BAYS } from './walk.ts';
import { BOOKS_PER_BAY, BOOKS_PER_SIDE, COLUMNS_PER_SHELF, bookColumnX, shelfBookIndex } from './shelf-layout.ts';
import { canvasTexture } from './materials.ts';
import type { Room } from './room.ts';

const palette=['#31564d','#8f4939','#30465c','#77613f','#6a4457','#85724a','#3c645e','#9b6951','#45546c','#6f5333','#596649','#743c42'];
const CELL_W=192,CELL_H=288,COLS=COLUMNS_PER_SHELF,ROWS=BOOKS_PER_BAY/COLS;
interface Batch { mesh:THREE.Mesh; indices:number[]; }
/** Cover-facing books share one mesh and a progressively filled artwork atlas per gallery. */
export class LibraryShelves {
  private batches:Batch[]=[];
  private generation=0;
  private loader=new THREE.TextureLoader();
  private pending:{priority:number;run:()=>void}[]=[];
  private loading=0;
  readonly selectable:THREE.Mesh[]=[];
  constructor(private room:Room,private invalidate:(shadows?:boolean)=>void){}
  bookIndex(hit:THREE.Intersection):number|undefined {
    const batch=this.batches.find(batch=>batch.mesh===hit.object);
    return batch?.indices[Math.floor((hit.faceIndex ?? -12)/12)];
  }
  stock(books:readonly Book[],page:number,real:boolean):void {
    const generation=++this.generation;this.pending=[];
    for(const {mesh} of this.batches){
      this.room.scene.remove(mesh);mesh.geometry.dispose();
      const material=mesh.material as THREE.MeshStandardMaterial;material.map?.dispose();material.dispose();
    }
    this.batches=[];this.selectable.length=0;
    BAYS.forEach((bay,bayIndex)=>{
      const indices:number[]=[],geometry:THREE.BufferGeometry[]=[];
      const cells:{book:Book;x:number;y:number}[]=[];
      const atlas=canvasTexture((COLS+1)*CELL_W,ROWS*CELL_H,ctx=>{
        ctx.fillStyle='#dfd5b8';ctx.fillRect(COLS*CELL_W,0,CELL_W,CELL_H);
        ctx.strokeStyle='#aa9d7d55';for(let y=0;y<CELL_H;y+=3){ctx.beginPath();ctx.moveTo(COLS*CELL_W,y);ctx.lineTo((COLS+1)*CELL_W,y);ctx.stroke();}
        for(let slot=0;slot<BOOKS_PER_BAY;slot++){
          const global=bayIndex*BOOKS_PER_BAY+slot;
          const index=real?shelfBookIndex(global,books.length,page):global%books.length;
          if(index===undefined)continue;
          const book=books[index],x=(slot%COLS)*CELL_W,y=Math.floor(slot/COLS)*CELL_H;
          ctx.save();ctx.translate(x,y);this.paintCover(ctx,book,palette[index%palette.length]);ctx.restore();
          cells.push({book,x,y});
          const side=slot<BOOKS_PER_SIDE?-1:1,row=Math.floor((slot%BOOKS_PER_SIDE)/COLS),col=slot%COLS;
          const height=.77+(index%3)*.018,width=.57;
          const piece=new THREE.BoxGeometry(width,height,.075),uv=piece.attributes.uv;
          for(let vertex=0;vertex<uv.count;vertex++){
            const face=Math.floor(vertex/4),u=uv.getX(vertex),v=uv.getY(vertex);
            if(face>=4)uv.setXY(vertex,(x+3+u*(CELL_W-6))/((COLS+1)*CELL_W),1-(y+3+(1-v)*(CELL_H-6))/(ROWS*CELL_H));
            else uv.setXY(vertex,(COLS*CELL_W+3+u*(CELL_W-6))/((COLS+1)*CELL_W),1-(3+(1-v)*(CELL_H-6))/(ROWS*CELL_H));
          }
          // Slight backward lean reads as a displayed book, with the artwork facing its aisle.
          piece.rotateX(-side*.08);
          piece.translate(bay.x+bookColumnX(col),.26+row*.93+height/2,bay.z+side*.55);
          geometry.push(piece);indices.push(index);
        }
      });
      if(!geometry.length){atlas.dispose();this.room.setShelfLabel(bayIndex,`${bayIndex+1} · THE COLLECTION`);return;}
      const merged=mergeGeometries(geometry,false)!;geometry.forEach(g=>g.dispose());
      const material=new THREE.MeshStandardMaterial({map:atlas,roughness:.8});
      const mesh=new THREE.Mesh(merged,material);mesh.receiveShadow=true;this.room.scene.add(mesh);
      this.batches.push({mesh,indices});this.selectable.push(mesh);
      const initial=(book:Book)=>book.title.replace(/^(a|an|the)\s+/i,'').charAt(0).toLocaleUpperCase();
      this.room.setShelfLabel(bayIndex,real?`GALLERY ${String(bayIndex+1).padStart(2,'0')}    ${initial(books[indices[0]])} — ${initial(books[indices[indices.length-1]])}`:`GALLERY ${String(bayIndex+1).padStart(2,'0')}`);
      for(const {book,x,y} of cells){
        if(!real||!book.coverId)continue;
        this.pending.push({priority:20-bay.z+(y<CELL_H*4?1:0),run:()=>{
          const done=()=>{this.loading--;this.drain();};
          this.loader.load(`/__library/cover/${encodeURIComponent(book.coverId!)}`,texture=>{
            if(generation===this.generation){
              const image=texture.image as HTMLImageElement,canvas=atlas.image as HTMLCanvasElement,ctx=canvas.getContext('2d')!;
              ctx.fillStyle='#17271f';ctx.fillRect(x+3,y+3,CELL_W-6,CELL_H-6);
              const scale=Math.min((CELL_W-6)/image.width,(CELL_H-6)/image.height),w=image.width*scale,h=image.height*scale;
              ctx.drawImage(image,x+(CELL_W-w)/2,y+(CELL_H-h)/2,w,h);atlas.needsUpdate=true;this.invalidate();
            }
            texture.dispose();done();
          },undefined,done);
        }});
      }
    });
    this.pending.sort((a,b)=>a.priority-b.priority);this.invalidate(true);this.drain();
  }
  private drain():void{while(this.loading<4&&this.pending.length){this.loading++;this.pending.shift()!.run();}}
  private paintCover(ctx:CanvasRenderingContext2D,book:Book,color:string):void {
    ctx.save();ctx.scale(CELL_W/128,CELL_H/192);
    const width=128,height=192;
    ctx.fillStyle=color;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='#d9bd7b';ctx.lineWidth=1;ctx.strokeRect(7,7,width-14,height-14);
    ctx.fillStyle='#ead6a4';ctx.font='10px Georgia';ctx.textAlign='center';ctx.fillText('THE READING ROOM',width/2,26,width-20);
    ctx.font='bold 14px Georgia';const words=book.title.split(' ');let line='',y=65;
    for(const word of words){if(ctx.measureText(line+' '+word).width>width-24&&line){ctx.fillText(line,width/2,y,width-24);y+=18;line=word;}else line+=(line?' ':'')+word;if(y>135)break;}
    ctx.fillText(line,width/2,y,width-24);ctx.font='9px Georgia';ctx.fillText(bookDisplayAuthor(book),width/2,169,width-22);ctx.restore();
  }
}
