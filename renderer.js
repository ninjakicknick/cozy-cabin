import { fireWarmth, teaWarmth } from './rhythms.js?v=50';
import { art, scenes } from './world.js?v=50';
export class CabinRenderer {
  constructor(scene,weather) {
    this.scene=scene;this.canvas=weather;this.ctx=weather.getContext('2d');
    this.layers=new Map();this.loads=new Map();this.sequence=0;this.view='room';this.motion=matchMedia('(prefers-reduced-motion: reduce)');
    this.flakes=Array.from({length:65},()=>({x:Math.random(),y:Math.random(),r:.4+Math.random()*1.7,s:.012+Math.random()*.025}));
    this.lastSnow=0;this.weather={snow:.4,wind:1};
    this.motion.addEventListener('change',()=>this.updateVideos());
    document.addEventListener('visibilitychange',()=>this.updateVideos());
  }
  async load(id) {
    if(this.loads.has(id))return this.loads.get(id);
    const task=(async()=>{
      const spec=art[id],layer=document.createElement('div');layer.className='scene-layer';layer.dataset.art=id;layer.inert=true;
      const img=new Image();img.alt=spec.alt;img.src=spec.src;img.decoding='async';
      await img.decode();layer.append(img);
      if(spec.night){const night=new Image();night.className='night-art';night.alt='';night.setAttribute('aria-hidden','true');night.src=spec.night;await night.decode();layer.append(night)}
      for(const [src,x,y,w,h] of spec.videos||[]){
        const mask=document.createElement('div');mask.className='video-mask';mask.setAttribute('aria-hidden','true');
        Object.assign(mask.style,{left:`${x}%`,top:`${y}%`,width:`${w}%`,height:`${h}%`});
        if(src.includes('window'))mask.classList.add('window-video');
        const video=document.createElement('video');video.src=src;video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';mask.append(video);layer.append(mask);
      }
      this.scene.prepend(layer);this.layers.set(id,layer);return layer;
    })();
    this.loads.set(id,task);task.catch(()=>this.loads.delete(id));return task;
  }
  async show(view) {
    const token=++this.sequence,spec=scenes[view];const layer=await this.load(spec.art);
    if(token!==this.sequence)return false;
    this.view=view;
    for(const [id,el] of this.layers){const active=id===spec.art;el.classList.toggle('active',active);el.inert=!active;el.setAttribute('aria-hidden',String(!active))}
    const [scale,x,y]=spec.zoom||[1,50,50];
    this.scene.style.transform=`scale(${scale}) translate(${(50-x)*(scale-1)/scale}%,${(50-y)*(scale-1)/scale}%)`;
    this.scene.dataset.art=spec.art;this.scene.dataset.view=view;this.updateVideos();
    // Only warm up immediately adjoining art after the current scene is ready.
    return true;
  }
  updateVideos(){
    const current=scenes[this.view].art;
    for(const [id,layer] of this.layers){
      for(const video of layer.querySelectorAll('video')){
        if(id===current&&!document.hidden&&!this.motion.matches)video.play().catch(()=>{});else video.pause();
        video.parentElement.hidden=this.motion.matches;
      }
    }
  }
  environment(memory,visit,weather) {
    this.weather=weather;const base=scenes[this.view].art;
    this.scene.classList.toggle('lamp-off',base==='loft'&&!memory.loftLamp||base==='porch'&&!memory.porchLamp);
    this.scene.classList.toggle('tea-warm',teaWarmth(memory)>.4);
    this.scene.style.setProperty('--tea-heat',teaWarmth(memory));
    this.scene.style.setProperty('--ember-light',.1+fireWarmth(memory)*.22);
    this.scene.style.setProperty('--night-depth',weather.night*.065);
    this.scene.classList.toggle('cat-near',visit.elapsed<visit.catUntil);
    this.scene.classList.toggle('clear-air',weather.hush);
    this.scene.classList.toggle('seed-traces',Boolean(memory.life.fedAt&&Date.now()-memory.life.fedAt<86400000));
    this.scene.classList.toggle('kettle-warm',Boolean(memory.kettleAt));
    this.scene.classList.toggle('record-playing',memory.recordOn);
    this.scene.classList.toggle('well-tended',memory.emberUntil>Date.now());
    this.scene.classList.toggle('window-open',memory.windowOpen);
    this.scene.classList.toggle('boat-moved',memory.boatMoved);
    this.scene.style.setProperty('--weather-blue',weather.blue);
    const light=document.querySelector('#far-light'),point=art[base].lights;
    light.hidden=!point;
    if(point){light.style.left=point[0]+'%';light.style.top=point[1]+'%';light.classList.toggle('answering',visit.elapsed<visit.signalUntil)}
    this.scene.classList.toggle('bird-visit',visit.elapsed<visit.birdUntil);
    this.scene.classList.toggle('scope-sharp',memory.scopeSharp===true);
  }
  drawSnow(now){
    if(now-this.lastSnow<50)return;const dt=Math.min((now-this.lastSnow)/1000,.1);this.lastSnow=now;
    const ctx=this.ctx,w=900,h=506;
    if(this.canvas.width!==w){this.canvas.width=w;this.canvas.height=h}
    ctx.clearRect(0,0,w,h);
    const polygon=art[scenes[this.view].art].snow;
    if(!polygon||document.hidden||this.motion.matches)return;
    ctx.save();ctx.beginPath();polygon.forEach(([x,y],i)=>i?ctx.lineTo(x*w/100,y*h/100):ctx.moveTo(x*w/100,y*h/100));ctx.closePath();ctx.clip();
    ctx.fillStyle='#dce8f4';const count=Math.ceil(this.flakes.length*this.weather.snow);
    for(let i=0;i<count;i++){const p=this.flakes[i];p.y=(p.y+p.s*dt)%1;p.x=(p.x+dt*(.012*this.weather.wind)+1)%1;ctx.globalAlpha=(.12+p.r*.09)*Math.min(1,count-i)*Math.min(1,Math.max(0,this.weather.snow*this.flakes.length-i));ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }
}
