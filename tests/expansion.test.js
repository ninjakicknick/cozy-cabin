import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { scenes,art } from '../world.js';
import { parentView,neighbor,readMemory,createVisit,advanceWorld,kettleState,weatherAt } from '../state.js';
import { gamepadCommands } from '../input.js';

test('all scene assets exist, exits resolve, and every scene has a finite route home',()=>{
 for(const [id,s] of Object.entries(scenes)){
  assert.ok(art[s.art],id);assert.ok(existsSync(art[s.art].src));if(art[s.art].night)assert.ok(existsSync(art[s.art].night));if(art[s.art].unlit)assert.ok(existsSync(art[s.art].unlit));if(art[s.art].variant?.unlit)assert.ok(existsSync(art[s.art].variant.unlit));
  for(const spot of s.spots||[])if(spot.go)assert.ok(scenes[spot.go],`${id}/${spot.id}`);
  let at=id,seen=new Set();while(at!=='room'){assert.ok(!seen.has(at),`parent cycle ${id}`);seen.add(at);at=parentView(at)}
 }
});
test('all spatial hotspots in every space can be reached with directional input',()=>{
 for(const [id,s] of Object.entries(scenes)){
  if(!s.spots)continue;
  const points=Object.fromEntries(s.spots.map(p=>[p.id,[p.x,p.y]]));
  const reached=new Set([s.default||s.spots[0].id]),queue=[...reached];
  while(queue.length){const from=queue.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const next=neighbor(from,dx,dy,points);if(!reached.has(next)){reached.add(next);queue.push(next)}}}
  assert.equal(reached.size,s.spots.length,`${id}: missing ${s.spots.filter(p=>!reached.has(p.id)).map(p=>p.id)}`);
 }
});
test('controller actions fire once when held; sticks repeat and release resets them',()=>{
 const pad={buttons:Array.from({length:16},()=>({pressed:false})),axes:[0,0]};pad.buttons[0].pressed=true;
 let r=gamepadCommands(pad,{},0);assert.deepEqual(r.commands,['act']);r=gamepadCommands(pad,r.state,100);assert.deepEqual(r.commands,[]);
 pad.buttons[0].pressed=false;pad.axes[0]=1;r=gamepadCommands(pad,r.state,200);assert.deepEqual(r.commands,['right']);r=gamepadCommands(pad,r.state,300);assert.deepEqual(r.commands,[]);r=gamepadCommands(pad,r.state,700);assert.deepEqual(r.commands,['right']);
 assert.deepEqual(gamepadCommands(null,r.state,800).state.buttons,[]);
 pad.axes[0]=0;pad.buttons[1].pressed=true;assert.deepEqual(gamepadCommands(pad,{},900).commands,['back']);
});
test('kettle is renewable, persistent, and notifies only once per boiling',()=>{
 const m=readMemory(undefined,100000),v=createVisit(4);m.kettleAt=100000;
 assert.equal(kettleState(m,120000),'warming');assert.equal(kettleState(m,140000),'ready');
 assert.ok(advanceWorld(v,m,'loft',1,140000).includes('kettle'));assert.ok(!advanceWorld(v,m,'loft',1,141000).includes('kettle'));
 m.kettleAt=0;assert.equal(kettleState(m,142000),'cold');m.kettleAt=150000;assert.ok(advanceWorld(v,m,'kitchen',1,190000).includes('kettle'));
});
test('patience events have cooldowns and survive a later visit as memory',()=>{
 const m=readMemory(undefined);m.life.seed=1;m.porchLamp=false;const v=createVisit(8);const events=[];
 for(let i=0;i<90;i++)events.push(...advanceWorld(v,m,'porchSeat',1,1800000));
 assert.equal(m.signalSeen,true);assert.equal(m.listened,true);const until=v.signalUntil;
 for(let i=0;i<20;i++)advanceWorld(v,m,'porchSeat',1,1800000);
 assert.equal(v.signalUntil,until);
 const restored=readMemory({getItem:()=>JSON.stringify(m)});assert.equal(restored.signalSeen,true);
});
test('a long idle visit remains bounded and weather changes without creating event floods',()=>{
 const m=readMemory(undefined),v=createVisit(23);let eventCount=0;
 for(let i=0;i<3600;i++)eventCount+=advanceWorld(v,m,'chair',1).length;
 assert.ok(eventCount>20&&eventCount<100);assert.equal(v.elapsed,3600);assert.ok(Number.isFinite(v.seed));
 assert.notEqual(weatherAt(1,12).snow,weatherAt(720000,12).snow);
 advanceWorld(v,m,'loft',1);assert.equal(v.still,0);
});
test('legacy memory migrates and stale appliance timestamps expire safely',()=>{
 const m=readMemory({getItem:()=>JSON.stringify({windowOpen:true,page:2,kettleAt:1,recordSide:99,loftLamp:false})},1e9);
 assert.equal(m.page,2);assert.equal(m.windowOpen,true);assert.equal(m.loftLamp,false);assert.equal(m.porchLamp,true);assert.equal(m.kettleAt,0);assert.equal(m.recordSide,1);
});

test('lights-out survives reload without resetting discovery or fire state',()=>{
 const m=readMemory({getItem:()=>JSON.stringify({lightsOn:false,loftLamp:false,porchLamp:false,secretOpen:true,clockKey:'clock',lanternTurning:true,emberUntil:200000})},100000);
 assert.equal(m.lightsOn,false);assert.equal(m.secretOpen,true);assert.equal(m.lanternTurning,true);assert.equal(m.emberUntil,200000);
 const again=readMemory({getItem:()=>JSON.stringify(m)},100001);assert.equal(again.lightsOn,false);assert.equal(again.loftLamp,false);assert.equal(again.porchLamp,false);
 assert.equal(readMemory().lightsOn,true);
});
test('controller lights button toggles once per press, including after reconnect',()=>{
 const pad={buttons:Array.from({length:16},()=>({pressed:false})),axes:[0,0]};pad.buttons[3].pressed=true;
 const first=gamepadCommands(pad,{},0);assert.deepEqual(first.commands,['lights']);assert.deepEqual(gamepadCommands(pad,first.state,1000).commands,[]);
 const released=gamepadCommands(null,first.state,1100);assert.deepEqual(gamepadCommands(pad,released.state,1200).commands,['lights']);
});
