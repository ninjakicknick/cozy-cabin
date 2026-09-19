// Wall time belongs to the place. Active time belongs to the person staying here.
// No clock, counters or schedule are exposed in the experience.
export const restingPlaces = ['chair','floor','window','windowLake','porchSeat','lake','bed','telescope','eaves','cushion','snugRest'];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const number=(v,a,b,f=0)=>Number.isFinite(v)?clamp(v,a,b):f;
export function readLife(raw={},now=Date.now()) {
  const r=raw && typeof raw==='object'?raw:{};
  const time=v=>Number.isFinite(v)&&v>0&&v<=now?v:0;
  return {
    seed:Math.floor(number(r.seed,1,2147483647,(now%2147483646)+1)),
    lastSeen:time(r.lastSeen),lastRest:restingPlaces.includes(r.lastRest)?r.lastRest:null,
    rests:Object.fromEntries(restingPlaces.map(id=>[id,number(r.rests?.[id],0,360000)])),
    teaPlace:restingPlaces.includes(r.teaPlace)?r.teaPlace:null,
    teaDays:Math.floor(number(r.teaDays,0,3650)),teaDay:typeof r.teaDay==='string'?r.teaDay.slice(0,10):'',
    fedAt:time(r.fedAt),birdDay:typeof r.birdDay==='string'?r.birdDay.slice(0,10):'',
    signalAt:time(r.signalAt),signalCount:Math.floor(number(r.signalCount,0,3)),
    sippedAt:time(r.sippedAt),recordAt:time(r.recordAt),
  };
}
export function localDay(now) {const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
const smooth=t=>t*t*(3-2*t);
function hash(n,seed){let x=(n^seed)>>>0;x=Math.imul(x^(x>>>16),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return ((x^(x>>>16))>>>0)/4294967295;}
export function weatherAt(now=Date.now(),seed=1) {
  const time=now/720000,front=Math.floor(time),p=smooth(time-front);
  const strength=hash(front,seed)*(1-p)+hash(front+1,seed)*p;
  const gust=(Math.sin(now/17000+seed)+Math.sin(now/43000))*.055;
  const hour=new Date(now).getHours()+new Date(now).getMinutes()/60;
  const night=(1+Math.cos((hour-2)*Math.PI/12))/2;
  return {name:strength<.28?'clearing':strength>.67?'snowfall':'flurries',snow:.06+strength*.94,
    wind:.58+strength*.9+gust,blue:.012+strength*.055,night,
    hush:strength<.23,phase:hour<6?'late':hour<11?'morning':hour<17?'afternoon':'evening'};
}
export function fireWarmth(memory,now=Date.now()) {
  return .55+.45*clamp((memory.emberUntil-now)/1200000,0,1);
}
export function teaWarmth(memory,now=Date.now()) {
  return memory.teaAt?clamp(1-(now-memory.teaAt)/900000,0,1):0;
}
export function restTrace(view,life) {
  if(life.rests[view]<120)return '';
  return ({chair:'The chair gives in the same place.',floor:'The rug has kept the shape of an elbow.',
    porchSeat:'Your end of the blanket is already turned back.',bed:'The quilt falls where your hands expect it.',
    snugRest:'The wool is warm where your shoulder settles.',cushion:'The wool has a familiar hollow.',window:'Your usual patch of glass clears first.'})[view]||'';
}
export function rememberTea(memory,now=Date.now()) {
  const day=localDay(now);if(memory.life.teaDay!==day){memory.life.teaDays++;memory.life.teaDay=day;}
  memory.teaAt=now;memory.life.sippedAt=0;
}

// Physical adjacency, separate from image reuse (the telescope is upstairs).
const zones={room:'hearth',chair:'hearth',floor:'hearth',fire:'hearth',books:'hearth',cat:'hearth',record:'hearth',window:'window',windowLake:'window',kitchen:'kitchen',drawer:'kitchen',mudroom:'threshold',porch:'porch',porchSeat:'porch',lake:'porch',loft:'loft',bed:'loft',telescope:'loft',eaves:'eaves',cushion:'eaves',clockWall:'clockWall',snug:'snug',snugRest:'snug',instrument:'snug'};
const links={hearth:{window:.5,kitchen:1,clockWall:.6},window:{hearth:.5,porch:2.3},kitchen:{hearth:1,threshold:1,loft:1.4},threshold:{kitchen:1,porch:1.2},porch:{threshold:1.2,window:2.3},loft:{kitchen:1.4,eaves:.8},eaves:{loft:.8},clockWall:{hearth:.6,snug:.9},snug:{clockWall:.9}};
export const soundOrigins={kettle:'kitchen',cup:'kitchen',chime:'porch',bird:'porch',owl:'porch',lakeBell:'porch',musicbox:'eaves',roof:'loft',wood:'hearth',purr:'hearth',needle:'hearth',key:'threshold',tick:'clockWall',winding:'clockWall',latch:'clockWall',toneLow:'snug',toneMiddle:'snug',toneHigh:'snug'};
export function propagation(view,origin,windowOpen=false) {
  const target=zones[view]||'hearth';if(!origin||target===origin)return {gain:1,cutoff:9000,pan:0};
  const distances=Object.fromEntries(Object.keys(links).map(id=>[id,Infinity]));distances[origin]=0;const done=new Set();
  while(done.size<Object.keys(links).length){
    const at=Object.keys(links).filter(id=>!done.has(id)).sort((a,b)=>distances[a]-distances[b])[0];done.add(at);
    for(const [next,cost] of Object.entries(links[at])){const edge=windowOpen&&[at,next].includes('window')&&[at,next].includes('porch')?.5:cost;distances[next]=Math.min(distances[next],distances[at]+edge);}
  }
  const d=distances[target];return {gain:Math.exp(-d*.64),cutoff:Math.max(450,7500*Math.exp(-d*.55)),pan:origin==='porch'?.28:origin==='kitchen'?.22:origin==='eaves'?-.2:-.18};
}
