import test from 'node:test';
import assert from 'node:assert/strict';
import {clockAction,canEnter,readClock} from '../clock.js';
import {readMemory,parentView,neighbor,navigationPoints} from '../state.js';
import {visibleSpots,art} from '../world.js';
import {propagation} from '../rhythms.js';
import {notebook} from '../stories.js';
import {existsSync} from 'node:fs';
const reload=m=>readMemory({getItem:()=>JSON.stringify(m)});
for(const [name,old] of [['fresh',{}],['existing',{windowOpen:true,page:3,loftLamp:false,blanket:true,life:{rests:{chair:450},teaDays:4}}]]){
 test(`${name} save: clue, key, clock, room, departure and return`,()=>{
  let m=reload(old);assert.match(notebook[3][1],/clock key/);
  assert.equal(canEnter('snug',m),false);assert.equal(visibleSpots('clockWall',m).length,1);
  assert.equal(clockAction(m,'clock').reveal,undefined);assert.equal(m.clockKey,'hook');
  clockAction(m,'key');assert.equal(m.clockKey,'pocket');m=reload(m);
  assert.equal(visibleSpots('mudroom',m).find(s=>s.id==='key').label,'The empty hook');
  clockAction(m,'clock');assert.equal(m.clockKey,'clock');assert.equal(m.secretOpen,false);m=reload(m);
  assert.equal(clockAction(m,'clock').reveal,true);assert.equal(canEnter('snug',m),true);assert.equal(m.clockRunning,true);
  assert.equal(visibleSpots('clockWall',m).find(s=>s.id==='passage').do,'opening');
  assert.equal(parentView('snugRest'),'snug');assert.equal(parentView('snug'),'clockWall');
  m=reload(m);assert.equal(m.secretOpen,true);clockAction(m,'clock');assert.equal(m.clockRunning,false);assert.equal(canEnter('snug',reload(m)),true);
  clockAction(m,'key');assert.equal(m.clockKey,'clock');assert.equal(clockAction(m,'clock').reveal,undefined);
  if(name==='existing'){assert.equal(m.windowOpen,true);assert.equal(m.page,3);assert.equal(m.loftLamp,false);assert.equal(m.life.rests.chair,450)}
 });
}
test('key-first, repeat actions and contradictory old data have natural bounded states',()=>{
 const m=readMemory();clockAction(m,'key');clockAction(m,'key');assert.equal(m.clockKey,'pocket');
 clockAction(m,'clock');clockAction(m,'clock');assert.equal(m.secretOpen,true);
 for(let i=0;i<20;i++)clockAction(m,'clock');assert.equal(m.secretOpen,true);
 assert.equal(readClock({secretOpen:true,clockKey:'hook'}).clockKey,'clock');
 assert.equal(readClock({clockRunning:true,secretOpen:false}).clockRunning,false);
 assert.equal(readClock({clockKey:'anything'}).clockKey,'hook');
});
test('directional navigation cannot select a concealed entrance and reaches it after opening',()=>{
 for(const opened of [false,true]){
  const m={secretOpen:opened},points=navigationPoints('clockWall',[],m),seen=new Set(['clock']),queue=['clock'];
  while(queue.length){const at=queue.shift();for(const [x,y] of [[0,1],[0,-1],[1,0],[-1,0]]){const next=neighbor(at,x,y,points);if(!seen.has(next)){seen.add(next);queue.push(next)}}}
  assert.equal(seen.has('passage'),opened);
 }
 for(const s of Object.values(art))if(s.variant)assert.ok(existsSync(s.variant.src));
});
test('clock and sheltered room occupy real acoustic locations',()=>{
 assert.ok(propagation('clockWall','clockWall').gain>propagation('room','clockWall').gain);
 assert.ok(propagation('snugRest','clockWall').gain>propagation('porch','clockWall').gain);
 assert.ok(propagation('snug','hearth').cutoff<propagation('room','hearth').cutoff);
});
