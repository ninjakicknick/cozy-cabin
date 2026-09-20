import { fireWarmth, teaWarmth } from './rhythms.js?v=66';
import { art, scenes } from './world.js?v=66';
export class CabinRenderer {
  constructor(scene,weather) {
    this.scene=scene;this.canvas=weather;this.ctx=weather.getContext('2d');
    this.layers=new Map();this.loads=new Map();this.sequence=0;this.view='room';this.motion=matchMedia('(prefers-reduced-motion: reduce)');
    this.flakes=Array.from({length:65},()=>({x:Math.random(),y:Math.random(),r:.4+Math.random()*1.7,s:.012+Math.random()*.025}));
    this.lantern=document.querySelector('#lantern-light');this.lctx=this.lantern.getContext('2d');this.lastLantern=0;this.ringUntil=0;
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
      if(spec.variant){const variant=new Image();variant.className='state-art '+spec.variant.state;variant.alt='';variant.setAttribute('aria-hidden','true');variant.src=spec.variant.src;if(spec.variant.clip)variant.style.clipPath=spec.variant.clip;await variant.decode();layer.append(variant)}
      for(const [src,kind,clip] of [[spec.unlit,'unlit-art'],[spec.variant?.unlit,'unlit-state '+spec.variant?.state,spec.variant?.clip]]){
        if(!src)continue;const dark=new Image();dark.className=kind;dark.alt='';dark.setAttribute('aria-hidden','true');dark.src=src;if(clip)dark.style.clipPath=clip;await dark.decode();layer.append(dark);
      }
      if(id==='clockWall'){const leaf=new Image();leaf.className='door-leaf';leaf.alt='';leaf.setAttribute('aria-hidden','true');leaf.src=spec.src;layer.append(leaf)}
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
    this.revealAnimation?.cancel();this.scene.classList.remove('revealing');
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
    this.scene.classList.toggle('key-away',memory.clockKey!=='hook');
    this.scene.classList.toggle('key-fitted',memory.clockKey==='clock');
    this.scene.classList.toggle('secret-open',memory.secretOpen&&memory.panelOpen);
    this.scene.classList.toggle('clock-running',memory.clockRunning);
    this.scene.classList.toggle('lantern-turning',memory.lanternTurning);
    this.scene.classList.toggle('lights-out',memory.lightsOn===false);
    this.scene.classList.toggle('eaves-dark',!memory.loftLamp);
    const leaf=this.layers.get('clockWall')?.querySelector('.door-leaf');if(leaf)leaf.src=memory.lightsOn===false?art.clockWall.unlit:art.clockWall.src;
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
  }
  async panel(open=true){
    if(this.motion.matches)return;
    const leaf=this.layers.get('clockWall')?.querySelector('.door-leaf');if(!leaf)return;
    this.revealAnimation?.cancel();
    this.scene.classList.add('revealing');
    const openFrames=[
      {transform:'perspective(900px) rotateY(0deg)',opacity:1,offset:0},
      {transform:'perspective(900px) rotateY(0deg)',opacity:1,offset:.2},
      {transform:'perspective(900px) rotateY(-78deg)',opacity:1,offset:.88},
      {transform:'perspective(900px) rotateY(-82deg)',opacity:0,offset:1}
    ];
    const frames=open?openFrames:[...openFrames].reverse().map(frame=>({...frame,offset:1-frame.offset}));
    this.revealAnimation=leaf.animate(frames,{duration:3200,easing:'cubic-bezier(.35,0,.25,1)',fill:'forwards'});
    try{await this.revealAnimation.finished}catch{}finally{this.scene.classList.remove('revealing')}
  }
  reveal(){return this.panel(true)}
  conceal(){return this.panel(false)}
  ring(id){this.ringUntil=performance.now()+2400;this.ringColor=id==='toneLow'?'244,170,80':id==='toneMiddle'?'157,196,182':'178,190,241';}
  drawLantern(now,memory){
    if(now-this.lastLantern<80)return;this.lastLantern=now;
    const c=this.lctx,w=900,h=506;if(this.lantern.width!==w){this.lantern.width=w;this.lantern.height=h}c.clearRect(0,0,w,h);
    const lanternView=scenes[this.view].art;if(!['snug','snugBed'].includes(lanternView)||(!memory.lanternTurning&&now>this.ringUntil))return;
    const t=this.motion.matches?0:now/24000;
    c.save();c.beginPath();if(lanternView==='snugBed'){c.rect(0,0,w,h)}else{c.moveTo(0,0);c.lineTo(225,0);c.lineTo(280,170);c.lineTo(640,190);c.lineTo(650,0);c.lineTo(900,0);c.lineTo(900,506);c.lineTo(660,400);c.lineTo(600,260);c.lineTo(60,270);c.closePath()}c.clip();
    for(let i=0;i<22;i++){
      const x=450+Math.cos(i*2.399+t)*430,y=220+Math.sin(i*1.41+t*.6)*190;
      const pulse=now<this.ringUntil?(this.ringUntil-now)/2400:0;
      const dark=memory.lightsOn===false,radius=(16+i%4*6)*(dark?1.35:1);
      const glow=c.createRadialGradient(x,y,0,x,y,radius);
      glow.addColorStop(0,`rgba(${pulse?this.ringColor:'255,210,135'},${dark?.58+pulse*.25:.34+pulse*.20})`);
      glow.addColorStop(.28,`rgba(${pulse?this.ringColor:'243,193,117'},${dark?.30+pulse*.16:.18+pulse*.12})`);
      glow.addColorStop(1,'transparent');
      c.fillStyle=glow;c.beginPath();c.ellipse(x,y,radius,radius,0,0,Math.PI*2);c.fill();
    }c.restore();
  }
  drawSnow(now){
    if(now-this.lastSnow<50)return;const dt=Math.min((now-this.lastSnow)/1000,.1);this.lastSnow=now;
    const ctx=this.ctx,w=900,h=506;
    if(this.canvas.width!==w){this.canvas.width=w;this.canvas.height=h}
    ctx.clearRect(0,0,w,h);
    const weatherArt=art[scenes[this.view].art],panes=weatherArt.snowPanes||(weatherArt.snow?[weatherArt.snow]:[]);
    if(!panes.length||document.hidden||this.motion.matches)return;
    ctx.save();ctx.beginPath();
    for(const polygon of panes){polygon.forEach(([x,y],i)=>i?ctx.lineTo(x*w/100,y*h/100):ctx.moveTo(x*w/100,y*h/100));ctx.closePath()}
    ctx.clip();
    ctx.fillStyle='#dce8f4';const count=Math.ceil(this.flakes.length*this.weather.snow);
    for(let i=0;i<count;i++){const p=this.flakes[i];p.y=(p.y+p.s*dt)%1;p.x=(p.x+dt*(.012*this.weather.wind)+1)%1;ctx.globalAlpha=(.12+p.r*.09)*Math.min(1,count-i)*Math.min(1,Math.max(0,this.weather.snow*this.flakes.length-i));ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }
}
