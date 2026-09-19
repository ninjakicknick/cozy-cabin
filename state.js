import { scenes } from './world.js?v=40';
export const STORAGE_KEY = 'cozy-cabin.memory.v1';
const integer=(value,min,max,fallback=0)=>Number.isInteger(value)?Math.max(min,Math.min(max,value)):fallback;
export function readMemory(storage,now=Date.now()) {
  let raw={};try{raw=JSON.parse(storage.getItem(STORAGE_KEY))||{}}catch{}
  const time=(value,maxAge,maxFuture=0)=>Number.isFinite(value)&&value>=now-maxAge&&value<=now+maxFuture?value:0;
  return {
    windowOpen:raw.windowOpen===true,recordOn:raw.recordOn===true,page:integer(raw.page,0,3),
    emberUntil:Number.isFinite(raw.emberUntil)?Math.min(raw.emberUntil,now+20*60e3):0,
    listened:raw.listened===true,muted:raw.muted===true,recordSide:integer(raw.recordSide,0,1),
    porchLamp:raw.porchLamp!==false,loftLamp:raw.loftLamp!==false,blanket:raw.blanket===true,quilt:raw.quilt===true,
    kettleAt:time(raw.kettleAt,10*60e3),teaAt:time(raw.teaAt,30*60e3),birdAt:time(raw.birdAt,24*3600e3),
    catPets:integer(raw.catPets,0,100),tinVisits:integer(raw.tinVisits,0,100),scarfTouches:integer(raw.scarfTouches,0,100),
    postcardRead:raw.postcardRead===true,letterRead:raw.letterRead===true,signalSeen:raw.signalSeen===true,
    musicbox:false,boatMoved:raw.boatMoved===true,visits:integer(raw.visits,0,10000),
  };
}
export function saveMemory(storage,memory){try{storage.setItem(STORAGE_KEY,JSON.stringify(memory))}catch{}}
export function parentView(view){return scenes[view]?.parent|| (view==='book'?'books':'room')}
export const positions=Object.fromEntries(scenes.room.spots.map(s=>[s.id,[s.x,s.y]]));
export function neighbor(current,dx,dy,points=positions,fallback='chair') {
  const ids=Object.keys(points);if(!points[current])return points[fallback]?fallback:ids[0];
  const [x,y]=points[current];
  return ids.filter(id=>id!==current).map(id=>{
    const [xx,yy]=points[id],forward=(xx-x)*dx+(yy-y)*dy,lateral=Math.abs((xx-x)*dy-(yy-y)*dx);
    return {id,score:forward>0?Math.hypot(xx-x,yy-y)+lateral*1.8:Infinity};
  }).sort((a,b)=>a.score-b.score).find(item=>Number.isFinite(item.score))?.id||current;
}
export function kettleState(memory,now=Date.now()) {
  if(!memory.kettleAt||now-memory.kettleAt>10*60e3)return 'cold';
  return now-memory.kettleAt>=35000?'ready':'warming';
}
// Active visit time, rather than frame count or wall clock, drives rare ambient events.
export function createVisit(seed=1){return {elapsed:0,still:0,quiet:0,lastView:'room',nextEvent:38,seed:(seed>>>0)||1,signalUntil:0,nextSignal:0,kettleNotified:0,birdUntil:0,owlUntil:0};}
function random(visit){visit.seed=(Math.imul(1664525,visit.seed)+1013904223)>>>0;return visit.seed/4294967296;}
export function advanceWorld(visit,memory,view,seconds,now=Date.now()) {
  const dt=Math.max(0,Math.min(seconds,2));visit.elapsed+=dt;
  if(view!==visit.lastView){visit.still=0;visit.lastView=view}else visit.still+=dt;
  const events=[];
  if(scenes[view]?.rest&&!memory.recordOn){visit.quiet+=dt;if(visit.quiet>75)memory.listened=true;}
  if(kettleState(memory,now)==='ready'&&visit.kettleNotified!==memory.kettleAt){visit.kettleNotified=memory.kettleAt;events.push('kettle');}
  const outside=['porch','porchSeat','lake','telescope'].includes(view);
  if(outside&&!memory.porchLamp&&visit.still>42&&visit.elapsed>visit.nextSignal){
    visit.signalUntil=visit.elapsed+16;visit.nextSignal=visit.elapsed+160;memory.signalSeen=true;events.push('lakeBell');
  }
  if(outside&&memory.birdAt&&now-memory.birdAt>26000&&now-memory.birdAt<180000&&visit.still>12){visit.birdUntil=visit.elapsed+4;memory.birdAt=0;events.push('bird');}
  if(visit.elapsed>visit.nextEvent){
    visit.nextEvent=visit.elapsed+48+random(visit)*60;
    const pool=outside?['chime','owl','lakeBell']:view==='eaves'||view==='cushion'?['musicbox','wood']:view==='loft'||view==='bed'?['roof','wood']:['wood','purr','roof'];
    const event=pool[Math.floor(random(visit)*pool.length)];events.push(event);if(event==='owl')visit.owlUntil=visit.elapsed+5;
  }
  return events;
}
export function weatherAt(elapsed,visitNumber=0){
  const phase=(elapsed+(visitNumber%3)*90)%330;
  if(phase<90)return {name:'flurries',snow:.45,wind:1,blue:.03};
  if(phase<180)return {name:'snowfall',snow:1,wind:1.3,blue:.075};
  if(phase<280)return {name:'clearing',snow:.12,wind:.66,blue:0};
  return {name:'flurries',snow:.4,wind:.95,blue:.03};
}
