// Private physical memory, not a progress ledger. All dates are bounded on read.
import { weatherAt } from './rhythms.js?v=67';
export const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0};
const flags=['foldRead','harmony','skyRemembered','compassAligned'];
export function readDiscoveries(raw,now=Date.now()){
 const r=raw&&typeof raw==='object'?raw:{};
 const time=k=>Number.isFinite(r[k])&&r[k]>0&&r[k]<=now?r[k]:0;
 return {...Object.fromEntries(flags.map(k=>[k,r[k]===true])),shoreSeenAt:time('shoreSeenAt'),quietAt:time('quietAt'),replyAt:time('replyAt'),lastBell:time('lastBell'),foldAt:time('foldAt')};
}
export function catAt(now,seed){
 const slot=Math.floor((now+seed%601*1000)/1020000),n=hash(slot^seed^1984)%10;
 return n<5?'room':n<7?'kitchen':n===7?'loft':n===8?'eaves':'away';
}
export function cabinAt(now,m){
 const d=m.discovery,w=weatherAt(now,m.life.seed),cat=m._catPlace||catAt(now,m.life.seed);
 const block=Math.floor(now/3600000),h=hash(block^m.life.seed^933);
 return {cat,night:w.phase==='late'||w.phase==='evening',frost:!m.lightsOn&&!m.windowOpen&&w.snow>.35,
  fold:d.foldAt>0,parcel:d.shoreSeenAt>0&&now-d.shoreSeenAt>240000&&now-d.shoreSeenAt<86400000,
  passingLight:h%5===0&&now%3600000>110000&&now%3600000<230000,
  sky:d.skyRemembered,reply:d.harmony&&d.replyAt&&now-d.replyAt<180000};
}
export function createAttention(){return {still:0,view:null,quietUntil:0,glassUntil:0,skyUntil:0,notes:[],noteAt:0,bell:null}}
export function disturb(a){a.still=0;a.quietUntil=0;a.glassUntil=0;a.skyUntil=0}
export function touchDiscovery(a,m,id,now){
 if(!id.startsWith('tone'))return;
 if(m.discovery.harmony)return false;
 if(now-a.noteAt>9000)a.notes=[];a.noteAt=now;a.notes.push(id);a.notes=a.notes.slice(-3);
 if(m.secretOpen&&m.lightsOn===false&&a.notes.join(',')==='toneMiddle,toneLow,toneHigh'){
  m.discovery.harmony=true;m.discovery.replyAt=now;return true;
 }
 return false;
}
// Called once per visible second. Quiet never accrues in readers or suspended tabs.
export function advanceDiscovery(a,m,view,dt,now,occupied=true){
 if(a.view!==view||!occupied){disturb(a);a.view=view}else a.still+=Number.isFinite(dt)?Math.max(0,Math.min(dt,1.5)):0;
 const d=m.discovery,c=cabinAt(now,m),sounds=[];
 if(['chair','floor'].includes(view)&&a.still>105&&m.emberUntil>now&&!m.recordOn&&now-d.quietAt>1800000){d.quietAt=now;a.quietUntil=now+55000;sounds.push('wood')}
 if(view==='window'&&a.still>42&&c.frost&&c.night)a.glassUntil=now+2500;
 if(view==='snugRest'&&a.still>85&&!m.lightsOn&&!m.lanternTurning){a.skyUntil=now+2500;d.skyRemembered=true}
 if(['eaves','cushion'].includes(view)&&a.still>55&&c.cat==='eaves'&&m.catPets>2&&!d.foldAt){d.foldAt=now;sounds.push('purr')}
 if(d.harmony&&now-d.replyAt>12000&&now-d.replyAt<16000&&a.bell!==d.replyAt){a.bell=d.replyAt;sounds.push('lakeReply')}
 return sounds;
}
