import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { BAYS } from './walk.ts';
import { canvasTexture, rugTexture, softShadow, timberTexture, windowTexture } from './materials.ts';

export interface Room { scene:THREE.Scene; wood:THREE.MeshStandardMaterial; brass:THREE.MeshStandardMaterial; setShelfLabel:(index:number,text:string)=>void; }
export function createReadingRoom(renderer:THREE.WebGLRenderer):Room {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#273a34');scene.fog=new THREE.Fog('#283a33',32,68);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const roomEnvironment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(roomEnvironment,.04).texture;scene.environmentIntensity=.20;
  roomEnvironment.dispose();pmrem.dispose();
  const woodMap=timberTexture();
  const wood=new THREE.MeshStandardMaterial({color:'#b89a76',map:woodMap,bumpMap:woodMap,bumpScale:.025,roughness:.57});
  const darkWood=new THREE.MeshStandardMaterial({color:'#5b4934',map:woodMap,roughness:.65});
  const brass=new THREE.MeshStandardMaterial({color:'#c6a86c',metalness:.65,roughness:.4});
  const wall=new THREE.MeshStandardMaterial({color:'#40574d',roughness:.96});
  const plaster=new THREE.MeshStandardMaterial({color:'#d2c6ad',roughness:1});
  function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,rounded=0):THREE.Mesh {
    const geometry=rounded?new RoundedBoxGeometry(w,h,d,2,rounded):new THREE.BoxGeometry(w,h,d);
    const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;
  }
  function cylinder(r:number,h:number,x:number,y:number,z:number,mat:THREE.Material):THREE.Mesh {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;
  }
  const floorMap=timberTexture(true);
  box(32,.16,35,0,-.1,4.5,new THREE.MeshStandardMaterial({map:floorMap,bumpMap:floorMap,bumpScale:.025,roughness:.67}));
  box(32,6,.2,0,3,-13,wall);box(32,6,.2,0,3,22,wall);
  for(const x of [-16,16]){
    box(.22,6,35,x,3,4.5,wall);box(.25,1.25,35,x,.625,4.5,darkWood);box(.3,.08,35,x,1.3,4.5,brass);
    for(let z=-12;z<22;z+=1.25)box(.3,1.05,.035,x,.65,z,wood);
    box(.35,.18,35,x,5.8,4.5,darkWood);box(.4,.04,35,x,5.65,4.5,brass);
  }
  box(32,1.25,.25,0,.625,-12.85,darkWood);box(32,.08,.3,0,1.3,-12.8,brass);
  for(let x=-15;x<16;x+=1.25)box(.035,1.05,.3,x,.65,-12.8,wood);
  box(32,.15,35,0,6,4.5,plaster);
  for(const z of [-11,-4,3,10,17])box(32,.3,.26,0,5.8,z,darkWood);
  for(const x of [-14,-5,5,14])box(.22,.2,35,x,5.83,4.5,darkWood);
  const hemisphere=new THREE.HemisphereLight('#e9ead2','#38463b',1.2);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight('#ffe0ad',2.3);sun.position.set(-9,10,-5);sun.target.position.set(4,0,4);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.camera.far=65;sun.shadow.normalBias=.035;sun.shadow.bias=-.0001;scene.add(sun,sun.target);
  function plaque(text:string,width:number,x:number,y:number,z:number):{mesh:THREE.Mesh;set:(text:string)=>void} {
    let texture:THREE.CanvasTexture;
    const material=new THREE.MeshStandardMaterial({roughness:.8,metalness:.1});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width*.15),material);mesh.position.set(x,y,z);scene.add(mesh);
    const set=(value:string)=>{texture?.dispose();texture=canvasTexture(1024,154,ctx=>{ctx.fillStyle='#18392e';ctx.fillRect(0,0,1024,154);ctx.strokeStyle='#ba9e66';ctx.lineWidth=3;ctx.strokeRect(8,8,1008,138);ctx.font='42px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ead7ab';ctx.fillText(value,512,80,950);});material.map=texture;material.needsUpdate=true;};
    set(text);return {mesh,set};
  }
  plaque('MY VIRTUAL LIBRARY',7.2,0,4.5,-12.65);
  plaque('A place for every story',5.3,0,3.42,-12.64);
  // Glazed arches frame an original illustrated twilight woodland.
  const glazing=new THREE.MeshBasicMaterial({map:windowTexture(),color:'#d8e3d3'});
  function arch(w:number,h:number,mat:THREE.Material):THREE.Mesh {
    const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w/2,h-w/2);shape.absarc(0,h-w/2,w/2,Math.PI,0,true);shape.lineTo(w/2,0);shape.closePath();
    const geometry=new THREE.ShapeGeometry(shape,32),uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+w/2)/w,uv.getY(i)/h);
    return new THREE.Mesh(geometry,mat);
  }
  for(const side of [-1,1])for(const z of [-8,0,8,16]){
    const group=new THREE.Group();group.position.set(side*15.82,1.6,z);group.rotation.y=-side*Math.PI/2;
    const frame=arch(3.3,3.65,wood);group.add(frame);
    const pane=arch(2.95,3.35,glazing);pane.position.set(0,.12,.025);group.add(pane);
    const vertical=new THREE.Mesh(new THREE.BoxGeometry(.065,3,.08),darkWood);vertical.position.set(0,1.62,.08);group.add(vertical);
    for(const y of [1.2,2.3]){const bar=new THREE.Mesh(new THREE.BoxGeometry(2.96,.06,.08),darkWood);bar.position.set(0,y,.08);group.add(bar);}
    const sill=new THREE.Mesh(new THREE.BoxGeometry(3.5,.13,.45),wood);sill.position.set(0,0,.1);group.add(sill);scene.add(group);
  }
  // Pendant pools are deliberately shadow-free; one sun supplies soft room shadows.
  const bulbMat=new THREE.MeshBasicMaterial({color:'#ffdc9a'});
  for(const z of [-6,1,8,15])for(const x of [-9,9]){
    cylinder(.018,.85,x,5.42,z,brass);
    const shade=new THREE.Mesh(new THREE.ConeGeometry(.48,.28,32,1,true),brass);shade.position.set(x,4.87,z);scene.add(shade);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),bulbMat);bulb.position.set(x,4.72,z);scene.add(bulb);
    const light=new THREE.PointLight('#ffcf8b',14,9,2);light.position.set(x,4.5,z);scene.add(light);
  }
  const labels:{set:(text:string)=>void}[]=[];
  BAYS.forEach((bay,index)=>{
    box(5.1,3.65,.12,bay.x,1.85,bay.z,wood);
    for(const side of [-1,1]){
      box(.19,3.85,1.32,bay.x+side*2.5,1.9,bay.z,wood);
      box(.25,3.85,.08,bay.x+side*2.5,1.9,bay.z+.7,darkWood);
      box(.04,3.5,.02,bay.x+side*2.5,1.9,bay.z+.755,brass);
    }
    for(let row=0;row<4;row++){
      box(5.1,.13,1.3,bay.x,.18+row*.93,bay.z,wood);
      for(const side of [-1,1])box(4.9,.025,.025,bay.x,.255+row*.93,bay.z+side*.65,brass);
    }
    box(5.35,.18,1.5,bay.x,3.88,bay.z,darkWood,.035);
    box(5.25,.055,1.43,bay.x,3.99,bay.z,wood);
    box(5.3,.18,1.42,bay.x,.08,bay.z,darkWood);
    const label=`GALLERY ${String(index+1).padStart(2,'0')}`;
    const front=plaque(label,3.9,bay.x,4.28,bay.z+.1),back=plaque(label,3.9,bay.x,4.28,bay.z-.1);
    back.mesh.rotation.y=Math.PI;labels.push({set:text=>{front.set(text);back.set(text);}});
  });
  // Layered woven runner and a lounge rug anchor the furniture.
  const rugMat=new THREE.MeshStandardMaterial({map:rugTexture(),roughness:1});
  const runnerMap=rugTexture(true);
  box(5.1,.012,26,0,.006,5.5,new THREE.MeshStandardMaterial({map:runnerMap,roughness:1}));box(8.5,.015,4.3,0,.012,-8.55,rugMat);
  const leather=new THREE.MeshStandardMaterial({color:'#8c5036',roughness:.72});
  for(const x of [-2.3,2.3]){
    box(1.65,.35,1.55,x,.55,-8.5,leather,.15);box(1.65,1.25,.32,x,1.02,-9.15,leather,.13);
    for(const side of [-1,1]){box(.3,.58,1.55,x+side*.83,.81,-8.5,leather,.12);box(.1,.4,.1,x+side*.65,.22,-8,brass);box(.1,.4,.1,x+side*.65,.22,-9,brass);}
    const cushion=box(1.25,.18,1.22,x,.79,-8.45,leather,.08);cushion.rotation.z=x>0?.025:-.025;
  }
  cylinder(.8,.1,0,.68,-8.25,wood);cylinder(.09,.64,0,.32,-8.25,brass);cylinder(.4,.055,0,.04,-8.25,darkWood);
  const paper=new THREE.MeshStandardMaterial({color:'#e4dcc2',roughness:1});
  const openBook=box(.65,.025,.42,0,.75,-8.25,paper);openBook.rotation.y=.2;box(.015,.035,.42,0,.77,-8.25,brass);
  // Articulated plants, a reading lamp, and contact shadows complete the nook.
  const foliage=[0x315f43,0x477754,0x5f865b].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
  const pot=new THREE.MeshStandardMaterial({color:'#a9754f',roughness:.9});
  for(const x of [-10.3,10.3]){
    cylinder(.4,.6,x,.3,-9.4,pot);cylinder(.3,.025,x,.61,-9.4,darkWood);
    for(let branch=0;branch<9;branch++){
      const angle=branch*2.4, radius=.2+(branch%3)*.18;
      const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),foliage[branch%3]);leaf.scale.set(.24,.48,.1);leaf.position.set(x+Math.cos(angle)*radius,1.03+(branch%4)*.24,-9.4+Math.sin(angle)*radius);leaf.rotation.set(.2,angle,Math.sin(angle)*.5);leaf.castShadow=true;scene.add(leaf);
    }
  }
  cylinder(.035,2.6,4.4,1.3,-9,brass);cylinder(.32,.06,4.4,.03,-9,brass);
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(.35,.55,.5,32,1,true),new THREE.MeshStandardMaterial({color:'#dfc99e',side:THREE.DoubleSide,roughness:1}));shade.position.set(4.4,2.5,-9);scene.add(shade);
  const readingLight=new THREE.PointLight('#ffd799',8,7,2);readingLight.position.set(4.4,2.2,-9);scene.add(readingLight);
  const shadowMap=softShadow();
  for(const x of [-2.3,0,2.3]){const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.026,-8.5);scene.add(shadow);}
  return {scene,wood,brass,setShelfLabel:(index,text)=>labels[index]?.set(text)};
}
