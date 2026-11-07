import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { bookDisplayAuthor, type Book } from './catalog.ts';
import { BAYS } from './walk.ts';
import { BOOKS_PER_BAY, shelfBookIndex } from './shelf-layout.ts';
import { canvasTexture } from './materials.ts';
import type { Room } from './room.ts';

const palette=['#31564d','#8f4939','#30465c','#77613f','#6a4457','#85724a','#3c645e','#9b6951','#45546c','#6f5333','#596649','#743c42'];
const CELL_W=64,CELL_H=256,COLS=12,ROWS=8;
interface Batch { mesh:THREE.Mesh; indices:number[]; }
/** One atlas and one merged book mesh per bay, rather than six draws for each book. */
export class LibraryShelves {
  private batches:Batch[]=[];
  private features:THREE.Mesh[]=[];
  private generation=0;
  private loader=new THREE.TextureLoader();
  readonly selectable:THREE.Mesh[]=[];
  constructor(private room:Room,private invalidate:()=>void){}
  bookIndex(hit:THREE.Intersection):number|undefined {
    if(typeof hit.object.userData.bookIndex==='number')return hit.object.userData.bookIndex;
    const batch=this.batches.find(batch=>batch.mesh===hit.object);
    return batch?.indices[Math.floor((hit.faceIndex ?? -12)/12)];
  }
  stock(books:readonly Book[],page:number,real:boolean):void {
    const generation=++this.generation;
    for(const mesh of [...this.batches.map(b=>b.mesh),...this.features]){
      this.room.scene.remove(mesh);mesh.geometry.dispose();
      for(const material of new Set(Array.isArray(mesh.material)?mesh.material:[mesh.material])){
        if(material instanceof THREE.MeshStandardMaterial){material.map?.dispose();material.dispose();}
      }
    }
    this.batches=[];this.features=[];this.selectable.length=0;
    BAYS.forEach((bay,bayIndex)=>{
      const indices:number[]=[],geometry:THREE.BufferGeometry[]=[];
      const atlas=canvasTexture((COLS+1)*CELL_W,ROWS*CELL_H,ctx=>{
        ctx.fillStyle='#dfd5b8';ctx.fillRect(COLS*CELL_W,0,CELL_W,CELL_H);
        ctx.strokeStyle='#aa9d7d55';for(let y=0;y<CELL_H;y+=3){ctx.beginPath();ctx.moveTo(COLS*CELL_W,y);ctx.lineTo((COLS+1)*CELL_W,y);ctx.stroke();}
        for(let slot=0;slot<BOOKS_PER_BAY;slot++){
          const global=bayIndex*BOOKS_PER_BAY+slot;
          const index=real?shelfBookIndex(global,books.length,page):global%books.length;
          if(index===undefined)continue;
          const book=books[index],x=(slot%COLS)*CELL_W,y=Math.floor(slot/COLS)*CELL_H;
          ctx.save();ctx.translate(x,y);this.paintSpine(ctx,book,palette[index%palette.length]);ctx.restore();
          const side=slot<48?-1:1,row=Math.floor((slot%48)/12),col=slot%12;
          const height=.59+(index%5)*.037,width=.285+(index%3)*.025;
          const piece=new THREE.BoxGeometry(width,height,.48),uv=piece.attributes.uv;
          for(let vertex=0;vertex<uv.count;vertex++){
            const face=Math.floor(vertex/4),u=uv.getX(vertex),v=uv.getY(vertex);
            if(face>=4)uv.setXY(vertex,(x+3+u*(CELL_W-6))/((COLS+1)*CELL_W),1-(y+3+(1-v)*(CELL_H-6))/(ROWS*CELL_H));
            else if(face===2||face===3)uv.setXY(vertex,(COLS*CELL_W+3+u*(CELL_W-6))/((COLS+1)*CELL_W),1-(3+(1-v)*(CELL_H-6))/(ROWS*CELL_H));
            else uv.setXY(vertex,(x+2)/((COLS+1)*CELL_W),1-(y+6+v*15)/(ROWS*CELL_H));
          }
          piece.rotateZ((index%7===0?.025:0)*side);
          piece.translate(bay.x-2.18+col*.39,.25+row*.93+height/2,bay.z+side*.37);
          geometry.push(piece);indices.push(index);
        }
      });
      if(!geometry.length){atlas.dispose();this.room.setShelfLabel(bayIndex,`${bayIndex+1} · THE COLLECTION`);return;}
      const merged=mergeGeometries(geometry,false)!;geometry.forEach(g=>g.dispose());
      const material=new THREE.MeshStandardMaterial({map:atlas,roughness:.78});
      const mesh=new THREE.Mesh(merged,material);mesh.receiveShadow=true;this.room.scene.add(mesh);
      this.batches.push({mesh,indices});this.selectable.push(mesh);
      const initial=(book:Book)=>book.title.replace(/^(a|an|the)\s+/i,'').charAt(0).toLocaleUpperCase();
      this.room.setShelfLabel(bayIndex,real?`${String(bayIndex+1).padStart(2,'0')}    ${initial(books[indices[0]])} — ${initial(books[indices[indices.length-1]])}`:`GALLERY ${bayIndex+1}`);
      // One face-out title per bay makes real artwork part of the room itself.
      const featuredIndex=indices[Math.floor(indices.length*.72)],book=books[featuredIndex];
      const fallback=canvasTexture(256,384,ctx=>{ctx.fillStyle=palette[featuredIndex%palette.length];ctx.fillRect(0,0,256,384);ctx.strokeStyle='#d3ba81';ctx.lineWidth=3;ctx.strokeRect(12,12,232,360);ctx.fillStyle='#f0dfb5';ctx.textAlign='center';ctx.font='24px Georgia';const words=book.title.split(' ');let line='',y=130;for(const word of words){if(ctx.measureText(line+' '+word).width>210){ctx.fillText(line,128,y);y+=32;line=word;}else line+=(line?' ':'')+word;}ctx.fillText(line,128,y);});
      const faceMat=new THREE.MeshStandardMaterial({map:fallback,roughness:.75});
      const face=new THREE.Mesh(new THREE.BoxGeometry(.55,.78,.055),[faceMat,faceMat,faceMat,faceMat,faceMat,faceMat]);
      face.position.set(bay.x,3.43,bay.z+.705);face.rotation.x=-.08;face.userData.bookIndex=featuredIndex;face.castShadow=true;this.room.scene.add(face);this.features.push(face);this.selectable.push(face);
      if(real&&book.coverId)this.loader.load(`/__library/cover/${encodeURIComponent(book.coverId)}`,texture=>{
        if(generation!==this.generation){texture.dispose();return;}
        texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;faceMat.map?.dispose();faceMat.map=texture;faceMat.needsUpdate=true;this.invalidate();
      },undefined,()=>{/* The original typographic cover remains visible. */});
    });
    this.invalidate();
  }
  private paintSpine(ctx:CanvasRenderingContext2D,book:Book,color:string):void {
    ctx.fillStyle=color;ctx.fillRect(0,0,CELL_W,CELL_H);
    const light=ctx.createLinearGradient(0,0,CELL_W,0);light.addColorStop(0,'#0005');light.addColorStop(.2,'#fff1');light.addColorStop(.8,'#0000');light.addColorStop(1,'#0004');ctx.fillStyle=light;ctx.fillRect(0,0,CELL_W,CELL_H);
    ctx.fillStyle='#d9bd7b';ctx.fillRect(6,12,52,1);ctx.fillRect(6,243,52,1);
    ctx.save();ctx.translate(32,127);ctx.rotate(-Math.PI/2);ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillStyle='#f1e2be';ctx.fillText(book.title.toLocaleUpperCase(),0,4,204);ctx.restore();
    ctx.fillStyle='#e5cc94';ctx.font='6px Georgia';ctx.textAlign='center';ctx.fillText(bookDisplayAuthor(book),32,234,53);
  }
}
