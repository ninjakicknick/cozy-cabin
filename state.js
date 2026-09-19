import { readClock } from './clock.js?v=62';
import { readLife, weatherAt, restingPlaces, restTrace, localDay } from './rhythms.js?v=62';
export { weatherAt };
import { scenes,visibleSpots } from './world.js?v=62';
export const STORAGE_KEY = 'cozy-cabin.memory.v1';
const integer=(value,min,max,fallback=0)=>Number.isInteger(value)?Math.max(min,Math.min(max,value)):fallback;
export function readMemory(storage,now=Date.now()) {
  let raw={};try{raw=JSON.parse(storage.getItem(STORAGE_KEY))||{}}catch{}
  const time=(value,maxAge,maxFuture=0)=>Number.isFinite(value)&&value>=now-maxAge&&value<=now+maxFuture?value:0;
  const life=readLife(raw.life,now);
  return {
    ...readClock(raw),
    windowOpen:raw.windowOpen===true,recordOn:raw.recordOn===true&&(!life.recordAt||now-life.recordAt<192000),page:integer(raw.page,0,3),
    emberUntil:Number.isFinite(raw.emberUntil)?Math.min(raw.emberUntil,now+20*60e3):0,
    listened:raw.listened===true,muted:raw.muted===true,recordSide:integer(raw.recordSide,0,1),
    porchLamp:raw.porchLamp!==false,loftLamp:raw.loftLamp!==false,blanket:raw.blanket===true,quilt:raw.quilt===true,
    kettleAt:time(raw.kettleAt,10*60e3),teaAt:time(raw.teaAt,30*60e3),birdAt:time(raw.birdAt,24*3600e3),
    catPets:integer(raw.catPets,0,100),tinVisits:integer(raw.tinVisits,0,100),scarfTouches:integer(raw.scarfTouches,0,100),
    postcardRead:raw.postcardRead===true,letterRead:raw.letterRead===true,signalSeen:raw.signalSeen===true,
    musicbox:false,boatMoved:raw.boatMoved===true,visits:integer(raw.visits,0,10000),life,
  };
}
export function saveMemory(storage,memory){try{storage.setItem(STORAGE_KEY,JSON.stringify(memory))}catch{}}
export function parentView(view){return scenes[view]?.parent|| (view==='book'?'books':'room')}
export function navigationPoints(view,actions=[],memory={}){const spec=scenes[view];return Object.fromEntries([...visibleSpots(view,memory).map(s=>[s.id,[s.x,s.y]]),...actions.map((id,i)=>[`action:${id}`,[50+(i-(actions.length-1)/2)*20,100]])]);}
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
// Active time is never reconstructed from time away or a suspended browser tab.
export function createVisit(seed=1,memory=null,now=Date.now()){
 const life=memory?.life;
 return {elapsed:0,still:0,quiet:0,lastView:'room',nextEvent:38,seed:(seed>>>0)||1,
  signalUntil:0,nextSignal:0,kettleNotified:memory?.kettleAt&&now-memory.kettleAt>=35000?memory.kettleAt:0,
  birdUntil:0,owlUntil:0,settled:false,traceSaid:false,catUntil:0,nextCat:95,
  familiar:life?{...life.rests}:{},returning:Boolean(life?.lastSeen&&now-life.lastSeen>20*60000),
  listeningUntil:0,lastSipNotice:0,nextGust:25,musicUntil:0,nextMusic:0,recordEnded:false};
}
function random(visit){visit.seed=(Math.imul(1664525,visit.seed)+1013904223)>>>0;return visit.seed/4294967296;}
export function advanceWorld(visit,memory,view,seconds,now=Date.now(),occupied=true) {
 const dt=Number.isFinite(seconds)?Math.max(0,Math.min(seconds,2)):0;visit.elapsed+=dt;
 if(view!==visit.lastView){visit.still=0;visit.lastView=view}else if(occupied)visit.still+=dt;
 const events=[],life=memory.life;
 const weather=weatherAt(now,life.seed);
 const resting=restingPlaces.includes(view)&&occupied;
 if(resting){
  life.rests[view]=Math.min(360000,life.rests[view]+dt);
  if(visit.still>20)life.lastRest=view;
  if(!memory.recordOn){visit.quiet+=dt;if(visit.quiet>75)memory.listened=true;}
  if(!visit.traceSaid&&visit.returning&&visit.still>16&&visit.familiar[view]>=120){
   const text=restTrace(view,{...life,rests:visit.familiar});
   if(text){events.push({text});visit.traceSaid=true;}
  }
 }
 visit.settled=resting&&visit.still>28;
 if(kettleState(memory,now)==='ready'&&visit.kettleNotified!==memory.kettleAt){visit.kettleNotified=memory.kettleAt;events.push('kettle');}
 if(memory.kettleAt&&now-memory.kettleAt>600000)memory.kettleAt=0;
 if(memory.teaAt&&now-memory.teaAt>900000)memory.teaAt=0;
 if(memory.recordOn){
  if(!life.recordAt)life.recordAt=now;
  if(now-life.recordAt>=192000){memory.recordOn=false;events.push('needle');visit.recordEnded=true;}
 }
 if(memory.musicbox&&visit.elapsed>visit.musicUntil){memory.musicbox=false;}
 else if(memory.musicbox&&visit.elapsed>visit.nextMusic){events.push('musicbox');visit.nextMusic=visit.elapsed+6;}
 const outside=['porch','porchSeat','lake','telescope','windowLake'].includes(view);
 // The same distant reply can recur, but no longer performs every few minutes.
 if(outside&&!memory.porchLamp&&visit.still>42&&now-life.signalAt>25*60000&&weather.snow<.72){
  visit.signalUntil=visit.elapsed+16;life.signalAt=now;life.signalCount=Math.min(3,life.signalCount+1);
  memory.signalSeen=true;events.push('lakeBell');
 }
 const justFed=memory.birdAt&&now-memory.birdAt>26000&&now-memory.birdAt<180000;
 const regular=life.fedAt&&now-life.fedAt<7*86400000&&life.birdDay!==localDay(now)&&weather.phase==='morning';
 if(outside&&visit.still>12&&(justFed||regular)){
  visit.birdUntil=visit.elapsed+7;memory.birdAt=0;life.birdDay=localDay(now);events.push('bird');
 }
 if(['chair','floor'].includes(view)&&visit.still>70&&visit.elapsed>visit.nextCat){
  visit.catUntil=visit.elapsed+28;visit.nextCat=visit.elapsed+480;events.push('purr');
 }
 if(visit.elapsed>visit.nextGust){
  visit.nextGust=visit.elapsed+55+random(visit)*80;
  if(weather.wind>1.04)events.push('chime');
 }
 if(visit.elapsed>visit.nextEvent){
  visit.nextEvent=visit.elapsed+70+random(visit)*110;
  // Sounds occur at their source, including rooms the listener isn't occupying.
  const pool=weather.phase==='late'||weather.phase==='evening'?['wood','roof','owl']:['wood','roof','bird'];
  if(memory.tinVisits>2&&memory.boatMoved&&weather.hush)pool.push('musicbox');
  const event=pool[Math.floor(random(visit)*pool.length)];events.push(event);if(event==='owl')visit.owlUntil=visit.elapsed+5;
 }
 return events;
}
