import test from 'node:test';
import assert from 'node:assert/strict';
import { readMemory,createVisit,advanceWorld } from '../state.js';
import { weatherAt,propagation,readLife,rememberTea,teaWarmth,restTrace,localDay } from '../rhythms.js';
import { CabinAudio } from '../audio.js';
const now=new Date(2026,8,19,8,0).getTime();
const restore=(m,t=now)=>readMemory({getItem:()=>JSON.stringify(m)},t);

test('weather is continuous across front boundaries, stable on reload and independent of visits',()=>{
 const m=readMemory(undefined,now),seed=m.life.seed;
 for(let i=0;i<100;i++){
  const t=Math.floor(now/720000)*720000+i*720000;
  const before=weatherAt(t-1,seed),after=weatherAt(t+1,seed);
  assert.ok(Math.abs(before.snow-after.snow)<.0001);
  assert.ok(Math.abs(before.wind-after.wind)<.0001);
  assert.ok(after.snow>=0&&after.snow<=1);
 }
 m.visits=100;assert.deepEqual(weatherAt(now,seed),weatherAt(now,restore(m).life.seed));
 assert.notEqual(weatherAt(now,seed).snow,weatherAt(now+720000,seed).snow);
});
test('rest is remembered without counting absence, reading or pathological frame deltas',()=>{
 const m=readMemory(undefined,now),v=createVisit(1,m,now);
 for(let i=0;i<150;i++)advanceWorld(v,m,'chair',1,now+i*1000);
 assert.equal(m.life.rests.chair,150);assert.equal(m.life.lastRest,'chair');
 assert.ok(restTrace('chair',m.life));m.life.lastSeen=now;
 const saved=restore(m,now+86400000),returnVisit=createVisit(1,saved,now+86400000);
 assert.equal(saved.life.rests.chair,150);assert.equal(returnVisit.returning,true);
 advanceWorld(returnVisit,saved,'chair',NaN,now+86400000,false);
 assert.equal(saved.life.rests.chair,150);
 const events=[];for(let i=0;i<30;i++)events.push(...advanceWorld(returnVisit,saved,'chair',1,now+86400000+i*1000));
 assert.equal(events.filter(e=>typeof e==='object').length,1);
 for(let i=0;i<60;i++)advanceWorld(returnVisit,saved,'chair',1,now+86400000+i*1000,false);
 assert.equal(saved.life.rests.chair,180);
});
test('distant replies keep their cooldown after reload and remain authored, not click-driven',()=>{
 const t=1800000,m=readMemory(undefined,t);m.life.seed=1;m.porchLamp=false;
 const v=createVisit(1,m,t);for(let i=0;i<90;i++)advanceWorld(v,m,'lake',1,t+i*1000);
 assert.equal(m.life.signalCount,1);
 const saved=restore(m,t+120000),again=createVisit(1,saved,t+120000);
 for(let i=0;i<90;i++)advanceWorld(again,saved,'lake',1,t+120000+i*1000);
 assert.equal(saved.life.signalCount,1);
});
test('tea cools while away; repeating a click cannot invent a daily habit',()=>{
 const m=readMemory(undefined,now);rememberTea(m,now);rememberTea(m,now+1000);
 assert.equal(m.life.teaDays,1);assert.ok(teaWarmth(m,now+450000)<.6);
 assert.equal(teaWarmth(m,now+1000000),0);
 rememberTea(m,now+86400000);assert.equal(m.life.teaDays,2);
});
test('a fed bird can return on another morning without another interaction',()=>{
 const m=readMemory(undefined,now);m.life.fedAt=now-86400000;m.life.birdDay=localDay(now-86400000);
 const v=createVisit(1,m,now),events=[];
 for(let i=0;i<40;i++)events.push(...advanceWorld(v,m,'porchSeat',1,now+i*1000));
 assert.equal(events.filter(e=>e==='bird').length,1);assert.equal(m.life.birdDay,localDay(now));
});
test('sounds follow physical rooms, including telescope and the open window',()=>{
 const near=propagation('kitchen','kitchen'),up=propagation('loft','kitchen'),far=propagation('porch','kitchen');
 assert.ok(near.gain>up.gain&&up.gain>far.gain);assert.ok(near.cutoff>up.cutoff);
 assert.deepEqual(propagation('telescope','kitchen'),up);
 assert.ok(propagation('windowLake','porch',true).gain>propagation('windowLake','porch',false).gain);
 assert.ok(propagation('cushion','hearth').cutoff<propagation('room','hearth').cutoff);
});
test('record sides end once; returning does not replay stale kettle notifications',()=>{
 const m=readMemory(undefined,now);m.recordOn=true;m.life.recordAt=now;m.kettleAt=now-50000;
 const v=createVisit(1,m,now);assert.ok(!advanceWorld(v,m,'room',1,now).includes('kettle'));
 assert.ok(advanceWorld(v,m,'room',1,now+192001).includes('needle'));
 assert.equal(m.recordOn,false);assert.ok(!advanceWorld(v,m,'room',1,now+193001).includes('needle'));
 m.recordOn=true;assert.equal(restore(m,now+86400000).recordOn,false);
});
test('new memory is bounded and tolerates old, corrupt and future values',()=>{
 const life=readLife({rests:{chair:Infinity,floor:-4,bed:1e12},lastRest:'missing',lastSeen:now+1000,seed:NaN,signalCount:999},now);
 assert.equal(life.rests.chair,0);assert.equal(life.rests.floor,0);assert.equal(life.rests.bed,360000);
 assert.equal(life.lastRest,null);assert.equal(life.lastSeen,0);assert.equal(life.signalCount,3);
 assert.doesNotThrow(()=>readLife(null,now));
});

test('spatial sound buses follow navigation and release every node after events end',()=>{
 const finished=[];
 const param=()=>({value:0,cancelAndHoldAtTime(){},setTargetAtTime(v){this.value=v},setValueAtTime(v){this.value=v},exponentialRampToValueAtTime(v){this.value=v}});
 const node=()=>({gain:param(),frequency:param(),pan:param(),connect(n){return n},disconnect(){},start(){finished.push(this)},stop(){}});
 const audio=new CabinAudio();audio.ctx={state:'running',currentTime:0,sampleRate:100,createGain:node,createBiquadFilter:node,createStereoPanner:node,createOscillator:node,createBufferSource:node,createBuffer:(c,n)=>({getChannelData:()=>new Float32Array(n)})};audio.master=node();
 audio.mix('porch',{});audio.sound('chime',false);assert.equal(audio.voices.size,1);
 const voice=[...audio.voices][0],near=voice.gain.gain.value;
 audio.mix('cushion',{});assert.ok(voice.gain.gain.value<near);
 while(finished.length)finished.shift().onended?.();assert.equal(audio.voices.size,0);
 audio.sound('purr',false);assert.equal(audio.voices.size,1);
 while(finished.length)finished.shift().onended?.();assert.equal(audio.voices.size,0);
});
