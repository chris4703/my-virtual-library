import type { Scene, PerspectiveCamera, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { N8AOPass } from 'n8ao';

/** Reuse the main renderer's ambient occlusion for depth between books and joinery. */
export function readingRoomRenderer(renderer:WebGLRenderer,scene:Scene,camera:PerspectiveCamera){
  const composer=new EffectComposer(renderer);
  const ao=new N8AOPass(scene,camera,innerWidth,innerHeight);
  ao.setQualityMode('Medium');
  ao.configuration.halfRes=true;ao.configuration.accumulate=false;
  ao.configuration.gammaCorrection=false;
  ao.configuration.aoRadius=.45;ao.configuration.distanceFalloff=1;
  ao.configuration.intensity=1.2;
  ao.autoDetectTransparency=false;ao.configuration.transparencyAware=false;
  composer.addPass(ao);
  const antialias=new ShaderPass(FXAAShader);composer.addPass(antialias);
  composer.addPass(new OutputPass());
  renderer.info.autoReset=false;
  function resize():void{
    composer.setSize(innerWidth,innerHeight);
    const ratio=renderer.getPixelRatio();
    antialias.material.uniforms.resolution.value.set(1/(innerWidth*ratio),1/(innerHeight*ratio));
  }
  resize();
  return {resize,render:()=>{renderer.info.reset();composer.render();}};
}
