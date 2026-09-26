import {hash} from './discoveries.js?v=67';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Each track owns a different physical place. Seed + absolute time define every
// interval, including its aftermath; entering a view cannot summon or reroll it.
const home=['pass','reading','curtains','dance','supper','wave','lamp','visitor','carry','celebrate','watching','upstairs'];
const shore=['dock','stroll','snowman','sled','hurry','two','lantern','shovel','tracks','nothing'];
const wild=['fox','hare','deer','owl','birds','nothing','nothing','nothing'];
function slot(now,seed,period,salt,pool){
 const shifted=now+(seed%911)*1000,index=Math.floor(shifted/period),h=hash(index^seed^salt),start=index*period-(seed%911)*1000+45000+h%135000;
 const duration=100000+hash(h)%150000,age=now-start;
 return {id:`${salt}:${index}`,kind:pool[h%pool.length],start,duration,age,progress:clamp(age/duration,0,1),active:age>=0&&age<duration,alpha:clamp(Math.min(age/7000,(duration-age)/7000),0,1),h};
}
export function shoreLifeAt(now,seed=1,m={}){
 const hour=new Date(now).getHours();
 const homePool=hour<6?['pass','reading','curtains','lamp','watching','upstairs','nothing','nothing','nothing','nothing','visitor','nothing']:home;
 const household=slot(now,seed,480000,201,homePool),outdoor=slot(now,seed,780000,401,shore),wildlife=slot(now,seed,1020000,601,wild),sky=slot(now,seed,2700000,801,['clear','clear','clear','clear','aurora','meteor','clear','clear']);
 const actors=[],props=[],p=outdoor.progress,h=household.progress;
 const add=(sprite,x,y,height,extra={})=>actors.push({sprite,x,y,height,...extra});
 if(outdoor.active){
  const alpha=outdoor.alpha;
  switch(outdoor.kind){
   case 'dock':add('sitting',1253,564,43,{alpha});break;
   case 'stroll':add('walking',1175+90*Math.sin(p*Math.PI),545,53,{alpha,flip:p>.5});break;
   case 'snowman':add('standing',1350,510,48,{alpha});break;
   case 'sled':add('walking',1430-p*170,523,47,{alpha,flip:true});add('sled',1453-p*170,530,23,{alpha});break;
   case 'hurry':add('walking',1155+80*Math.sin(p*Math.PI*2),534,53,{alpha,flip:p>.25&&p<.75,fast:true});break;
   case 'two':add('standing',1243,563,50,{alpha});add('sitting',1271,565,39,{alpha});break;
   case 'lantern':add('carrying',938+p*210,509,78,{alpha});props.push({kind:'glow',x:943+p*210,y:481,alpha});break;
   case 'shovel':add('carrying',1167,523,76,{alpha,rotation:Math.sin(p*30)*.05});break;
   case 'tracks':add('hare',1330-p*190,552,17,{alpha});break;
  }
 }
 // Remains until the following outing, including across a closed browser.
 for(let i=0;i<4;i++){
  const prior=slot(now-i*780000,seed,780000,401,shore);
  if(prior.kind==='snowman'&&now>prior.start+prior.duration*.45&&now<prior.start+3000000){props.push({kind:'snowman',x:1383,y:516,alpha:Math.min(1,(now-prior.start-prior.duration*.45)/15000)});break}
 }
 if(household.active){const alpha=household.alpha;
  if(household.kind==='visitor')add('standing',1155,505,52,{alpha});
  if(household.kind==='carry')add('carrying',1155+25*Math.sin(h*Math.PI),514,79,{alpha});
  if(household.kind==='celebrate')add('celebration',1195,533,57,{alpha});
 }
 if(wildlife.active){const a=wildlife.alpha;
  if(wildlife.kind==='fox')add('fox',490+wildlife.progress*225,514,29,{alpha:a*.9});
  if(wildlife.kind==='hare')add('hare',796-wildlife.progress*100,538,16,{alpha:a*.85});
  if(wildlife.kind==='deer')add('deer',1530,481,57,{alpha:a*.83});
  if(wildlife.kind==='birds')for(let i=0;i<5;i++)add('owl',300+wildlife.progress*600-i*18,285+Math.sin(i)*10,7,{alpha:a*.8});
  if(wildlife.kind==='owl')add('owl',1606,393,21,{alpha:a*.8});
 }
 const rare=slot(now,seed,5460000,999,Array.from({length:29},(_,i)=>i===28?'still':'none'));
 if(rare.active&&rare.kind==='still')add('standing',874,672,35,{alpha:rare.alpha*.55});
 if(m.discovery?.compassAligned&&sky.active&&sky.kind==='clear')props.push({kind:'glow',x:251,y:451,alpha:.5});
 return {household,outdoor,wildlife,sky,actors,props,rare};
}
