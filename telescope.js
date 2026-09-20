import {SHORE,aim,clamp,shoreAt,telescopeAxes} from './telescope-world.js?v=66';
const spriteNames=['walking','standing','dancing','fox','owl','paper-boat'];
export class Telescope {
 constructor(root,memory,onWake,onSave){
  this.root=root;this.memory=memory;this.onWake=onWake;this.onSave=onSave;this.canvas=root.querySelector('canvas');this.c=this.canvas.getContext('2d');this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.keys=new Set();this.images={};this.active=false;this.drag=null;this.lastDraw=0;
  this.position={x:memory.telescope.x,y:memory.telescope.y};this.target={...this.position};
  root.addEventListener('pointerdown',e=>{if(!this.active||e.button!==0||this.drag)return;e.preventDefault();root.setPointerCapture(e.pointerId);this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};root.classList.add('dragging');this.onWake()});
  root.addEventListener('pointermove',e=>{if(this.drag?.id!==e.pointerId)return;const scale=SHORE.field/root.getBoundingClientRect().width;this.target=aim(this.target.x-(e.clientX-this.drag.x)*scale,this.target.y-(e.clientY-this.drag.y)*scale);this.drag.x=e.clientX;this.drag.y=e.clientY;this.onWake()});
  const release=e=>{if(this.drag?.id===e.pointerId){this.drag=null;root.classList.remove('dragging');this.remember()}};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(type,release);
  addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  addEventListener('blur',()=>this.clearInput());document.addEventListener('visibilitychange',()=>{this.clearInput();if(document.hidden)this.remember()});
 }
 clearInput(){if(this.drag&&this.root.hasPointerCapture(this.drag.id))this.root.releasePointerCapture(this.drag.id);this.drag=null;this.keys.clear();this.root.classList.remove('dragging')}
 async load(){
  if(this.loading)return this.loading;
  this.loading=Promise.all(['shore',...spriteNames].map(async name=>{const img=new Image();img.src=`assets/telescope/${name}.webp`;await img.decode();this.images[name]=img})).catch(e=>{this.loading=null;throw e});return this.loading;
 }
 show(active){this.active=active;this.root.hidden=!active;this.clearInput();if(active){this.lastDraw=0;this.draw(Date.now())}else this.remember()}
 remember(){Object.assign(this.memory.telescope,this.target);this.onSave()}
 key(key){if(!this.active)return false;if(['arrowleft','a','arrowright','d','arrowup','w','arrowdown','s'].includes(key)){this.keys.add(key);return true}return false}
 update(dt,now,pad){
  if(!this.active)return;dt=clamp(dt,0,.05);const axes=telescopeAxes(pad),k=this.keys;
  let x=axes.x+(k.has('arrowright')||k.has('d')?1:0)-(k.has('arrowleft')||k.has('a')?1:0),y=axes.y+(k.has('arrowdown')||k.has('s')?1:0)-(k.has('arrowup')||k.has('w')?1:0);
  const length=Math.max(1,Math.hypot(x,y));x/=length;y/=length;
  if(x||y){this.target=aim(this.target.x+x*135*dt,this.target.y+y*135*dt);this.onWake()}
  const ease=this.motion.matches?1:1-Math.exp(-dt*17);
  this.position.x+=(this.target.x-this.position.x)*ease;this.position.y+=(this.target.y-this.position.y)*ease;
  Object.assign(this.memory.telescope,this.target);
  if(now-this.lastDraw>1000/30){this.lastDraw=now;this.draw(Date.now())}
 }
 sprite(name,x,y,height,{alpha=1,flip=false,rotation=0}={}){
  const c=this.c,img=this.images[name];if(!img)return;const w=height*img.width/img.height;
  c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(rotation);c.scale(flip?-1:1,1);c.drawImage(img,-w/2,-height,w,height);c.restore();
 }
 window(x,y,w,h,light,curtain,person){
  const c=this.c;c.save();c.beginPath();
  // Keep existing timber mullions in front of the life behind the glass.
  for(let col=0;col<4;col++)for(let row=0;row<2;row++)c.rect(x+col*w/4+1,y+row*h/2+1,w/4-2,h/2-2);
  c.clip();c.fillStyle=`rgba(9,18,32,${1-light})`;c.fillRect(x,y,w,h);
  if(person){c.save();c.filter='brightness(.32)';this.sprite(person.kind,person.x,y+h+13,63,{alpha:.9,rotation:person.rotation||0});c.restore()}
  c.fillStyle='#5e4632';const cw=2+curtain*w*.49;c.fillRect(x,y,cw,h);c.fillRect(x+w-cw,y,cw,h);
  c.fillStyle='#b1875238';for(let i=3;i<cw;i+=3){c.fillRect(x+i,y,1,h);c.fillRect(x+w-i,y,1,h)}c.restore();
 }
 draw(now){
  if(!this.images.shore)return;const rect=this.root.getBoundingClientRect(),size=Math.round(rect.width*Math.min(devicePixelRatio||1,2));if(this.canvas.width!==size){this.canvas.width=size;this.canvas.height=size}
  const c=this.c,scale=size/SHORE.field,world=shoreAt(now,this.memory.life.seed,this.memory.boatMoved),t=this.motion.matches?0:now/1000;
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,size,size);c.scale(scale,scale);c.translate(SHORE.field/2-this.position.x,SHORE.field/2-this.position.y);
  c.drawImage(this.images.shore,0,0,SHORE.width,SHORE.height);
  // Very restrained movement only on the water. No scene-wide wobble.
  if(!this.motion.matches){c.save();c.globalAlpha=.10;for(let y=628;y<887;y+=7){const offset=Math.sin(t*.55+y*.13)*1.1;c.drawImage(this.images.shore,0,y,1774,3,offset,y,1774,3)}c.restore()}
  this.window(1044,416,50,43,world.light,world.curtain,world.pass!==null?{kind:'standing',x:1036+world.pass*69}:null);
  this.window(1178,420,46,40,world.light,world.curtain,world.dance?{kind:'dancing',x:1200,rotation:Math.sin(t*1.8)*.10}:null);
  this.window(1118,334,23,33,world.attic,0,null);
  if(world.person)this.sprite(world.person.kind,world.person.x,world.person.y,63,{alpha:world.person.alpha,flip:world.person.flip,rotation:world.person.kind==='walking'?Math.sin(t*3)*.018:0});
  if(world.fox)this.sprite('fox',world.fox.x,world.fox.y,31,{alpha:world.fox.alpha*.85});
  if(world.owl)this.sprite('owl',1606,393,21,{alpha:.8});
  if(world.paperBoat)this.sprite('paper-boat',world.paperBoat.x,world.paperBoat.y+Math.sin(t)*1,28,{alpha:world.paperBoat.alpha*.8});
  // A quiet visual continuation of the cabin's existing light reply.
  if(this.signal){c.fillStyle=`rgba(255,214,137,${.2+.7*Math.pow(Math.sin(t*1.2),8)})`;c.beginPath();c.ellipse(251,451,3,5,0,0,Math.PI*2);c.fill()}
  this.root.classList.toggle('soft-focus',!this.memory.telescope.sharp);
 }
}
