import * as THREE from 'three';

/** Original, deterministic surfaces: no remote artwork or private files. */
export function canvasTexture(width:number,height:number,paint:(ctx:CanvasRenderingContext2D)=>void):THREE.CanvasTexture {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  paint(canvas.getContext('2d')!);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;return texture;
}
function random(seed=31415):()=>number{return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function timberTexture(floor=false):THREE.CanvasTexture {
  const rng=random();
  const texture=canvasTexture(1024,1024,ctx=>{
    ctx.fillStyle='#856444';ctx.fillRect(0,0,1024,1024);
    const rows=floor?8:1;
    for(let row=0;row<rows;row++){
      const h=1024/rows,offset=floor?(row%2)*256:0;
      for(let x=-512+offset;x<1024;x+=512){
        const light=Math.floor(rng()*15);
        ctx.fillStyle=`rgb(${133+light},${96+light},${61+light})`;ctx.fillRect(x,row*h,511,h-2);
        for(let line=0;line<180;line++){
          const y=row*h+rng()*(h-4);ctx.beginPath();ctx.moveTo(x,y);
          ctx.bezierCurveTo(x+160,y+Math.sin(line)*5,x+360,y-3,x+512,y+2);
          ctx.strokeStyle=rng()>.5?'#e9c59725':'#35241628';ctx.lineWidth=.4+rng()*1.3;ctx.stroke();
        }
        if(floor){ctx.fillStyle='#35271970';ctx.fillRect(x,row*h,1,h);ctx.fillRect(x,row*h,512,1);}
      }
    }
  });
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(floor?4:1,floor?4:1);return texture;
}
export function rugTexture(runner=false):THREE.CanvasTexture {
  const rng=random(87);
  const width=runner?384:1024,height=runner?1240:640;
  return canvasTexture(width,height,ctx=>{
    ctx.fillStyle='#713f37';ctx.fillRect(0,0,width,height);
    const borders=[['#c6a16b',20],['#273e37',32],['#b38b57',38],['#273e37',47],['#a87250',65]] as const;
    for(const [color,inset] of borders){ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(inset,inset,width-2*inset,height-2*inset);}
    for(let x=runner?125:150;x<width-80;x+=runner?134:180)for(let y=130;y<height-80;y+=170){
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#c2a16a';ctx.fillRect(-24,-24,48,48);ctx.fillStyle='#29453b';ctx.fillRect(-16,-16,32,32);ctx.restore();
    }
    for(let n=0;n<70000;n++){ctx.fillStyle=rng()>.5?'#f3d3a01a':'#0e1d141a';ctx.fillRect(rng()*width,rng()*height,1,2);}
  });
}
export function windowTexture():THREE.CanvasTexture {
  const rng=random(13);
  return canvasTexture(512,768,ctx=>{
    const gradient=ctx.createLinearGradient(0,0,0,768);gradient.addColorStop(0,'#263f50');gradient.addColorStop(.55,'#83978b');gradient.addColorStop(1,'#d8c9a4');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,768);
    ctx.fillStyle='#f7e6bc';ctx.beginPath();ctx.arc(340,280,65,0,Math.PI*2);ctx.fill();
    for(let layer=0;layer<3;layer++)for(let x=-30;x<560;x+=30+rng()*40){
      const height=140+rng()*200+layer*20,bottom=800+layer*25;
      ctx.fillStyle=['#678278','#47695e','#294b40'][layer];ctx.beginPath();ctx.moveTo(x,bottom-height);ctx.lineTo(x-50,bottom);ctx.lineTo(x+50,bottom);ctx.closePath();ctx.fill();
    }
  });
}
export function softShadow():THREE.CanvasTexture {
  return canvasTexture(128,128,ctx=>{const g=ctx.createRadialGradient(64,64,10,64,64,64);g.addColorStop(0,'#0009');g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);});
}
