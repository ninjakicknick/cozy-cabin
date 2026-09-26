import {cabinAt} from './discoveries.js?v=67';
import {art,scenes} from './world.js?v=67';
// One small, lazy layer follows the scene's existing transform and coordinate
// system. It does not run another animation loop or allocate per-frame textures.
export class LivingDetails {
 constructor(scene){
  this.scene=scene;this.images={};this.last=0;this.motion=matchMedia('(prefers-reduced-motion: reduce)');
  this.canvas=document.createElement('canvas');this.canvas.id='living-details';this.canvas.setAttribute('aria-hidden','true');this.canvas.width=1000;this.canvas.height=562;scene.append(this.canvas);this.c=this.canvas.getContext('2d');
  this.patch=new Image();this.patch.className='empty-sofa';this.patch.alt='';this.patch.setAttribute('aria-hidden','true');this.patch.src='assets/life/room-empty.webp';scene.append(this.patch);
  this.ready=Promise.all(['cat-alert','cat-sleep','mitten','fold'].map(async name=>{const img=new Image();img.src=`assets/life/${name}.webp`;await img.decode();this.images[name]=img})).catch(()=>{});
 }
 sprite(name,x,y,width,alpha=1){const img=this.images[name];if(!img)return;const h=width*img.height/img.width;this.c.save();this.c.globalAlpha=alpha;this.c.drawImage(img,x-width/2,y-h,width,h);this.c.restore()}
 draw(now,view,m,a){
  if(now-this.last<100)return;this.last=now;const c=this.c,cabin=cabinAt(now,m),base=scenes[view].art,dark=!m.lightsOn; c.clearRect(0,0,1000,562);
  this.patch.hidden=base!=='room';
  c.save();c.filter=dark?'brightness(.36) sepia(.15)':'brightness(.82)';
  const cats={room:[883,478,155,'cat-sleep'],kitchen:[370,473,76,'cat-alert'],loft:[250,310,97,'cat-sleep'],eaves:[622,402,120,'cat-sleep']};
  if(cabin.cat===base&&cats[base]){const [x,y,w,img]=cats[base];this.sprite(img,x,y,w)}
  if(base==='eaves'&&cabin.fold)this.sprite('fold',747,410,37);
  if(base==='mudroom'&&cabin.parcel)this.sprite('mitten',372,415,39);
  c.restore();
  if(base==='snug'&&m.discovery.harmony){
   c.save();c.globalAlpha=dark?.42:.13;c.strokeStyle='#e8d9ac';c.lineWidth=1;c.beginPath();c.moveTo(736,390);c.lineTo(748,370);c.lineTo(764,382);c.stroke();c.restore();
  }
  if(a.glassUntil>now&&view==='window'){
   c.save();c.beginPath();c.rect(447,116,253,140);c.clip();c.fillStyle='rgba(203,220,227,.32)';c.font='italic 10px Georgia';c.translate(535,198);c.rotate(-.07);c.fillText('middle · low · high',0,0);c.restore();
  }
  if(a.quietUntil>now&&['chair','floor'].includes(view)){
   const alpha=Math.min(1,(a.quietUntil-now)/10000,(now-(a.quietUntil-55000))/10000);
   c.save();c.globalAlpha=alpha*.24;c.fillStyle='#f9bc75';
   for(let i=0;i<13;i++){const t=this.motion.matches?0:now/5000+i*1.71,x=(base==='floor'?610:830)+Math.sin(t*.32+i)*70,y=(base==='floor'?270:190)-(t*9+i*13)%125;c.beginPath();c.arc(x,y,.6+i%2*.35,0,Math.PI*2);c.fill()}c.restore();
  }
  if(a.skyUntil>now&&base==='snugBed'){
   c.save();c.beginPath();for(const poly of art.snugBed.snowPanes){poly.forEach(([x,y],i)=>i?c.lineTo(x*10,y*5.62):c.moveTo(x*10,y*5.62));c.closePath()}c.clip();
   const sheen=c.createLinearGradient(240,0,740,430);sheen.addColorStop(0,'transparent');sheen.addColorStop(.48,'rgba(132,198,183,.10)');sheen.addColorStop(.7,'rgba(149,159,211,.08)');sheen.addColorStop(1,'transparent');c.fillStyle=sheen;c.fillRect(0,0,1000,562);
   c.fillStyle='#d8e7f2';for(const [x,y,r] of [[430,88,1.1],[481,128,.9],[535,102,1.3],[604,166,.8],[581,207,1],[400,187,.6]]){c.globalAlpha=.45;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}c.restore();
  }
  if(cabin.passingLight&&['room','kitchen','loft'].includes(base)&&dark){
   c.save();const phase=(now%3600000-110000)/120000;c.globalAlpha=Math.sin(phase*Math.PI)*.075;const g=c.createLinearGradient(0,0,1000,562);g.addColorStop(0,'transparent');g.addColorStop(.5,'#eac496');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,250,1000,90);c.restore();
  }
 }
}
