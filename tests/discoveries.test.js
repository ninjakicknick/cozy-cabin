import test from 'node:test';
import assert from 'node:assert/strict';
import {readMemory} from '../state.js';
import {readDiscoveries,createAttention,advanceDiscovery,disturb,touchDiscovery,catAt} from '../discoveries.js';
import {shoreLifeAt} from '../shore-life.js';
const start=new Date(2026,8,26,20).getTime();
test('old and damaged saves migrate without losing the clock or admitting future events',()=>{
 const m=readMemory({getItem:()=>JSON.stringify({secretOpen:true,clockKey:'clock',discovery:{harmony:true,replyAt:start+1,quietAt:Infinity,shoreSeenAt:start-1000}})},start);
 assert.equal(m.secretOpen,true);assert.equal(m.discovery.harmony,true);assert.equal(m.discovery.replyAt,0);assert.equal(m.discovery.quietAt,0);assert.equal(m.discovery.shoreSeenAt,start-1000);
 assert.doesNotThrow(()=>readDiscoveries(null));assert.deepEqual(readDiscoveries({},start),readDiscoveries(undefined,start));
});
test('real stillness excludes interaction, readers, navigation, and long suspended frames',()=>{
 const m=readMemory(undefined,start);m.emberUntil=start+1200000;const a=createAttention();
 for(let i=0;i<95;i++)advanceDiscovery(a,m,'chair',1,start+i*1000);
 assert.equal(m.discovery.quietAt,0);disturb(a);
 for(let i=95;i<190;i++)advanceDiscovery(a,m,'chair',1,start+i*1000);
 assert.equal(m.discovery.quietAt,0);
 advanceDiscovery(a,m,'chair',100000,start+190000,false);assert.equal(a.still,0);
 advanceDiscovery(a,m,'floor',NaN,start+191000);assert.equal(a.still,0);
 for(let i=192;i<302;i++)advanceDiscovery(a,m,'floor',1,start+i*1000);
 assert.ok(m.discovery.quietAt>0);const saved=m.discovery.quietAt;
 for(let i=302;i<650;i++)advanceDiscovery(a,m,'floor',1,start+i*1000);
 assert.equal(m.discovery.quietAt,saved);
});
test('quiet cooldown and discoveries survive reload; no retroactive idle reward',()=>{
 const m=readMemory(undefined,start);m.discovery.quietAt=start;m.discovery.skyRemembered=true;
 const restored=readMemory({getItem:()=>JSON.stringify(m)},start+60000),a=createAttention();
 assert.equal(restored.discovery.skyRemembered,true);assert.equal(a.still,0);
 restored.emberUntil=start+1200000;
 for(let i=0;i<160;i++)advanceDiscovery(a,restored,'chair',1,start+60000+i*1000);
 assert.equal(restored.discovery.quietAt,start);
});
test('the physical instrument keeps note order, expiry, darkness, and one reply',()=>{
 const m=readMemory(undefined,start),a=createAttention();m.secretOpen=true;m.lightsOn=false;
 touchDiscovery(a,m,'toneLow',start);touchDiscovery(a,m,'toneMiddle',start+1000);touchDiscovery(a,m,'toneHigh',start+2000);assert.equal(m.discovery.harmony,false);
 touchDiscovery(a,m,'toneMiddle',start+12000);touchDiscovery(a,m,'toneLow',start+13000);touchDiscovery(a,m,'toneHigh',start+14000);assert.equal(m.discovery.harmony,true);
 assert.deepEqual(advanceDiscovery(a,m,'instrument',1,start+27000),['lakeReply']);
 assert.deepEqual(advanceDiscovery(a,m,'instrument',1,start+28000),[]);
 const at=m.discovery.replyAt;touchDiscovery(a,m,'toneMiddle',start+29000);assert.equal(m.discovery.replyAt,at);
});
test('shore schedules persist across visits and leave bounded physical traces',()=>{
 const kinds=new Set(),seed=3451;let rare=0,active=0,props=0,samples=0;
 for(let i=0;i<86400*30;i+=60){
  const now=start+i*1000,w=shoreLifeAt(now,seed,{});samples++;
  assert.deepEqual(w,shoreLifeAt(now,seed,{}));
  if(w.household.active){active++;kinds.add(w.household.kind)}
  if(w.outdoor.active)kinds.add(w.outdoor.kind);
  if(w.wildlife.active)kinds.add(w.wildlife.kind);
  if(w.rare.active&&w.rare.kind==='still')rare++;
  if(w.props.some(p=>p.kind==='snowman'))props++;
  for(const actor of w.actors){assert.ok(actor.x>0&&actor.x<1774&&actor.y>0&&actor.y<887);assert.ok(actor.alpha>=0&&actor.alpha<=1)}
 }
 assert.ok(kinds.size>=25);assert.ok(active/samples>.3&&active/samples<.6);assert.ok(rare>0&&rare/samples<.003);assert.ok(props>0);
});
test('cat routines include home, other rooms and absence and remain stable on reload',()=>{
 const places=new Set();for(let i=0;i<86400*3;i+=60){const a=catAt(start+i*1000,37);assert.equal(a,catAt(start+i*1000,37));places.add(a)}
 assert.deepEqual([...places].sort(),['away','eaves','kitchen','loft','room']);
});
