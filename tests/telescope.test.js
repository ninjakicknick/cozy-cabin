import test from 'node:test';
import assert from 'node:assert/strict';
import {readTelescope,aim,shoreAt,telescopeAxes} from '../telescope-world.js';
import {readMemory} from '../state.js';
test('telescope survives reload, migrates legacy saves and bounds invalid positions',()=>{
 const m=readMemory();assert.deepEqual(m.telescope,{x:870,y:430,sharp:true});
 m.telescope={x:1250,y:550,sharp:false};assert.deepEqual(readMemory({getItem:()=>JSON.stringify(m)}).telescope,m.telescope);
 assert.deepEqual(readTelescope({x:Infinity,y:-100,sharp:'false'}),{x:870,y:275,sharp:true});
 assert.deepEqual(readTelescope(null),{x:870,y:430,sharp:true});
 for(const [x,y] of [[-999,-99],[10000,10000]]){const p=aim(x,y);assert.ok(p.x-275>=0&&p.x+275<=1774&&p.y-275>=0&&p.y+275<=887)}
});
test('the shore is independent of visits, bounded over days and mostly quiet',()=>{
 const seed=9451,start=Date.UTC(2026,8,20);let outdoors=0,boats=0,quiet=0;
 for(let n=0;n<86400*3;n+=10){const a=shoreAt(start+n*1000,seed,true);assert.deepEqual(a,shoreAt(start+n*1000,seed,true));
  assert.ok(a.curtain>=0&&a.curtain<=1&&a.light>=.169&&a.light<=1);
  if(a.person){outdoors++;assert.ok(a.person.x>=1155&&a.person.x<=1255&&a.person.y>=490&&a.person.y<=565)}
  if(a.paperBoat){boats++;assert.equal(shoreAt(start+n*1000,seed,false).paperBoat,null)}
  if(!a.person&&a.pass===null&&!a.dance&&!a.fox&&!a.owl&&!a.paperBoat)quiet++;
 }
 assert.ok(outdoors>0&&outdoors<8640*.6);assert.ok(boats>0&&boats<8640*.1);assert.ok(quiet>8640*1.5);
});
test('controller telescope axes support fine movement, diagonals, D-pad and disconnect',()=>{
 assert.deepEqual(telescopeAxes(null),{x:0,y:0});assert.deepEqual(telescopeAxes({axes:[.1,-.1]}),{x:0,y:0});
 const partial=telescopeAxes({axes:[.3,-.6]});assert.ok(partial.x>0&&partial.x<.2&&partial.y<-.4);
 const buttons=Array.from({length:16},()=>({pressed:false}));buttons[15].pressed=true;buttons[12].pressed=true;
 assert.deepEqual(telescopeAxes({buttons,axes:[1,-1]}),{x:1,y:-1});
});
