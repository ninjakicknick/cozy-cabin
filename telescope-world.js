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
 const seconds=now/1000+(seed%797),cycle=Math.floor(seconds/360),t=seconds-cycle*360,h=hash(cycle^seed);
 // Six-minute slices keep the shore patient without assuming anyone watches for hours.
 // Most slices offer some ordinary life, but none is guaranteed to perform on arrival.
 const outing=(h%5)!==0,walkStart=42+(h%54),p=t-walkStart;
 let person=null;
 if(outing&&p>=0&&p<150){
  const travel=p<34?p/34:p>116?(150-p)/34:1;
  const path=travel<.52?{x:1155+25*travel/.52,y:490+45*travel/.52}:{x:1180+75*(travel-.52)/.48,y:535+30*(travel-.52)/.48};
  person={...path,kind:p>=34&&p<=116?'standing':'walking',flip:p>116,alpha:Math.min(1,p/3,(150-p)/3)};
 }
 const pass=(t>18&&t<42)?(t-18)/24:null;
 // A private little moment should feel lucky, not require weeks of telescope duty.
 const dance=h%3===0&&t>252&&t<292;
 const curtain=smooth((t-220)/5)*(1-smooth((t-306)/5));
 const light=1-.83*smooth((t-286)/7)*(1-smooth((t-342)/7));
 const foxStart=105+h%70,fox=t>foxStart&&t<foxStart+58?{x:520+(t-foxStart)*4.05,y:513,alpha:Math.min(1,(t-foxStart)/5,(foxStart+58-t)/5)}:null;
 const rareCycle=Math.floor(seconds/2220),rareT=seconds-rareCycle*2220,rare=hash(rareCycle^seed^7291);
 return {person,pass,dance,curtain,light,attic:.2+.8*smooth((t-190)/5)*(1-smooth((t-330)/5)),fox,owl:h%3===0&&t>155&&t<300,
  paperBoat:boatMoved&&rare%12===0&&rareT>700&&rareT<860?{x:650+(rareT-700)*1.7,y:733,alpha:Math.min(1,(rareT-700)/12,(860-rareT)/12)}:null};
}
export function telescopeAxes(pad){
 const dead=v=>Math.abs(v||0)<.18?0:Math.sign(v)*(Math.abs(v)-.18)/.82;
 return {x:clamp(dead(pad?.axes?.[0])+(pad?.buttons?.[15]?.pressed?1:0)-(pad?.buttons?.[14]?.pressed?1:0),-1,1),y:clamp(dead(pad?.axes?.[1])+(pad?.buttons?.[13]?.pressed?1:0)-(pad?.buttons?.[12]?.pressed?1:0),-1,1)};
}
