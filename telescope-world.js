// The shore runs on wall time, not visits. Looking away never rerolls a moment.
export const SHORE = { width:1774, height:887, field:550 };
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n)};
const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0};
export function readTelescope(raw={}){
 return {x:Number.isFinite(raw?.x)?clamp(raw.x,275,1499):870,y:Number.isFinite(raw?.y)?clamp(raw.y,275,612):430,sharp:raw?.sharp!==false};
}
export function aim(x,y){return {x:clamp(x,275,1499),y:clamp(y,275,612)}}
export function shoreAt(now,seed=1,boatMoved=false){
 const seconds=now/1000+(seed%797),cycle=Math.floor(seconds/1080),t=seconds-cycle*1080,h=hash(cycle^seed);
 // The house has long quiet stretches. Each 18-minute interval has its own routine.
 const outing=(h%4)!==0,walkStart=260+(h%170),p=t-walkStart;
 let person=null;
 if(outing&&p>=0&&p<170){
  const travel=p<38?p/38:p>130?(170-p)/40:1;
  const path=travel<.52?{x:1155+25*travel/.52,y:490+45*travel/.52}:{x:1180+75*(travel-.52)/.48,y:535+30*(travel-.52)/.48};
  person={...path,kind:p>=38&&p<=130?'standing':'walking',flip:p>130,alpha:Math.min(1,p/3,(170-p)/3)};
 }
 const pass=(t>88&&t<108)?(t-88)/20:null;
 const dance=h%5===0&&t>550&&t<581;
 const curtain=smooth((t-610)/5)*(1-smooth((t-900)/5));
 const light=1-.83*smooth((t-915)/7)*(1-smooth((t-1045)/7));
 const foxStart=140+h%370,fox=t>foxStart&&t<foxStart+65?{x:520+(t-foxStart)*3.6,y:513,alpha:Math.min(1,(t-foxStart)/5,(foxStart+65-t)/5)}:null;
 const rareCycle=Math.floor(seconds/2220),rareT=seconds-rareCycle*2220,rare=hash(rareCycle^seed^7291);
 return {person,pass,dance,curtain,light,attic:.2+.8*smooth((t-770)/5)*(1-smooth((t-970)/5)),fox,owl:h%3===0&&t>400&&t<830,
  paperBoat:boatMoved&&rare%12===0&&rareT>700&&rareT<860?{x:650+(rareT-700)*1.7,y:733,alpha:Math.min(1,(rareT-700)/12,(860-rareT)/12)}:null};
}
export function telescopeAxes(pad){
 const dead=v=>Math.abs(v||0)<.18?0:Math.sign(v)*(Math.abs(v)-.18)/.82;
 return {x:clamp(dead(pad?.axes?.[0])+(pad?.buttons?.[15]?.pressed?1:0)-(pad?.buttons?.[14]?.pressed?1:0),-1,1),y:clamp(dead(pad?.axes?.[1])+(pad?.buttons?.[13]?.pressed?1:0)-(pad?.buttons?.[12]?.pressed?1:0),-1,1)};
}
