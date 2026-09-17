const scene=document.querySelector('#scene'),caption=document.querySelector('#caption'),back=document.querySelector('#back'),hint=document.querySelector('#hint'),fireEffects=document.querySelector('#fire-effects'),catEffects=document.querySelector('#cat-effects'),actionPanel=document.querySelector('#action-panel'),primaryAction=document.querySelector('#primary-action');
const things={books:{scale:1.9,x:10,y:31,text:'Books, old photos, and things nobody has thrown away.'},fire:{scale:2.18,x:24,y:60,text:'The fire settles into a slow, steady crackle.'},window:{scale:1.75,x:62,y:28,text:'Snow keeps falling beyond the glass.'},chair:{scale:1.65,x:54,y:58,text:'This looks like the correct place to disappear for a while.'},record:{scale:2,x:86,y:49,text:'The record player is waiting for something good.'},cat:{scale:2.35,x:88,y:76,text:'Fast asleep. Probably. One ear twitches when you get close.'}};
const order=['books','fire','chair','window','record','cat'],catLines=['A sleepy purr starts up under your hand.','One eye opens. You have been deemed acceptable.','The paw stretches out, then curls back into the blanket.','A tiny chirp. Apparently that was the correct spot.'];let focused=null,selected=-1,lastButtons=[],fireBusy=false,fireLevel=0,catPets=0,audioCtx=null;

// Ambient soundscape. Playback is retried on later user gestures until both tracks
// are genuinely playing. Some mobile browsers reject the first play() attempt even
// when it came from a gesture, so never permanently mark audio as started too early.
const windSrc='assets/audio/winter-wind-loop.mp3',windA=new Audio(windSrc),windB=new Audio(windSrc);
const ambience={ready:false,starting:false,fire:new Audio('assets/audio/fireplace-loop.mp3'),wind:windA,windLevel:.01};
ambience.fire.loop=true;ambience.fire.preload='auto';windA.preload=windB.preload='auto';windA.loop=windB.loop=true;
const windCrossfade={active:windA,standby:windB,seconds:3,running:false,timer:0};
function setWindLevel(level){ambience.windLevel=level;if(!windCrossfade.running)windCrossfade.active.volume=level}
function armWindCrossfade(){
  clearTimeout(windCrossfade.timer);
  const active=windCrossfade.active;
  if(!Number.isFinite(active.duration)||active.duration<=windCrossfade.seconds)return;
  const delay=Math.max(0,(active.duration-active.currentTime-windCrossfade.seconds)*1000);
  windCrossfade.timer=setTimeout(startWindCrossfade,delay);
}
async function startWindCrossfade(){
  if(windCrossfade.running)return;
  const from=windCrossfade.active,to=windCrossfade.standby,duration=windCrossfade.seconds*1000,started=performance.now();
  windCrossfade.running=true;to.currentTime=0;to.volume=0;
  try{await to.play()}catch(e){windCrossfade.running=false;from.loop=true;from.volume=ambience.windLevel;armWindCrossfade();return}
  function step(now){
    if(!windCrossfade.running)return;
    const p=Math.min(1,(now-started)/duration),level=ambience.windLevel;
    from.volume=level*Math.cos(p*Math.PI/2);to.volume=level*Math.sin(p*Math.PI/2);
    if(p<1){requestAnimationFrame(step);return}
    from.pause();from.currentTime=0;from.volume=0;
    windCrossfade.active=to;windCrossfade.standby=from;ambience.wind=to;windCrossfade.running=false;to.volume=level;armWindCrossfade();
  }
  requestAnimationFrame(step);
}
[windA,windB].forEach(w=>w.addEventListener('loadedmetadata',()=>{if(w===windCrossfade.active&&!windCrossfade.running)armWindCrossfade()}));
const ambientMix={room:{fire:.34,wind:.18},fire:{fire:.72,wind:.08},window:{fire:.12,wind:.48},books:{fire:.27,wind:.13},chair:{fire:.31,wind:.14},record:{fire:.22,wind:.12},cat:{fire:.25,wind:.13}};
function mixAmbience(place='room',seconds=1.8){if(!ambience.ready)return;const mix=ambientMix[place]||ambientMix.room,started=performance.now(),duration=seconds*1000,fireStart=ambience.fire.volume,windStart=ambience.windLevel;function step(now){const p=Math.min(1,(now-started)/duration),ease=p*p*(3-2*p);ambience.fire.volume=fireStart+(mix.fire-fireStart)*ease;setWindLevel(windStart+(mix.wind-windStart)*ease);if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)}
async function startAmbience(){if(ambience.ready||ambience.starting)return;ambience.starting=true;ambience.fire.volume=.01;setWindLevel(.01);try{await Promise.all([ambience.fire.paused?ambience.fire.play():Promise.resolve(),windCrossfade.active.paused?windCrossfade.active.play():Promise.resolve()]);if(!ambience.fire.paused&&!windCrossfade.active.paused){ambience.ready=true;armWindCrossfade();mixAmbience(focused||'room',2.5)}}catch(e){/* A later user gesture will retry. */}finally{ambience.starting=false}}
function wakeAudio(){startAmbience();getAudio()}
['pointerdown','touchend','keydown'].forEach(type=>addEventListener(type,wakeAudio,{passive:true}));

function transformFor(t){const dx=(50-t.x)*(t.scale-1)/t.scale,dy=(50-t.y)*(t.scale-1)/t.scale;return `scale(${t.scale}) translate(${dx}%,${dy}%)`}
function focusThing(id){const t=things[id];focused=id;mixAmbience(id);scene.style.transform=transformFor(t);document.querySelectorAll('.spot').forEach(s=>s.classList.toggle('active',s.dataset.id===id));caption.textContent=t.text;caption.classList.add('show');back.classList.add('show');hint.style.opacity=0;fireEffects.classList.toggle('show',id==='fire');catEffects.classList.toggle('show',id==='cat');actionPanel.classList.toggle('show',id==='fire'||id==='cat');if(id==='fire'){primaryAction.textContent=fireLevel>=3?'Fire is well tended':fireLevel?'Add another log':'Add a log';primaryAction.disabled=fireLevel>=3}else if(id==='cat'){primaryAction.textContent='Pet the cat';primaryAction.disabled=false}}
function reset(){focused=null;fireBusy=false;mixAmbience('room');scene.style.transform='';document.querySelectorAll('.spot').forEach(s=>s.classList.remove('active'));caption.classList.remove('show');back.classList.remove('show');fireEffects.className='';catEffects.className='';actionPanel.classList.remove('show');primaryAction.disabled=false}
function select(i){selected=(i+order.length)%order.length;document.querySelectorAll('.spot').forEach(s=>s.classList.toggle('selected',s.dataset.id===order[selected]))}function move(dir){if(focused)return;if(selected<0)return select(0);select(selected+dir)}
function tendFire(){if(focused!=='fire'||fireBusy||fireLevel>=3)return;fireBusy=true;fireLevel=Math.min(fireLevel+1,3);primaryAction.disabled=true;primaryAction.textContent='Tending…';caption.textContent='You set another log onto the grate.';fireEffects.classList.add('tending');scene.classList.add('fire-surge');setTimeout(()=>{caption.textContent='The new wood catches. Heat rolls into the room.';fireEffects.classList.remove('tending');fireEffects.classList.add('surge')},850);setTimeout(()=>{scene.classList.remove('fire-surge');fireEffects.classList.remove('surge');fireEffects.classList.add('warm');caption.textContent=fireLevel>=3?'That should keep the cabin warm for a long while.':'The fire settles into a warmer, brighter crackle.';primaryAction.textContent=fireLevel>=3?'Fire is well tended':'Add another log';primaryAction.disabled=fireLevel>=3;fireBusy=false},3100)}
async function getAudio(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')await audioCtx.resume();return audioCtx}catch(e){return null}}
async function purr(){const ctx=await getAudio();if(!ctx)return;const now=ctx.currentTime,duration=1.65,master=ctx.createGain(),filter=ctx.createBiquadFilter();master.gain.setValueAtTime(.0001,now);master.gain.exponentialRampToValueAtTime(.22,now+.045);master.gain.setValueAtTime(.22,now+1.25);master.gain.exponentialRampToValueAtTime(.0001,now+duration);filter.type='lowpass';filter.frequency.value=520;filter.Q.value=.7;filter.connect(master).connect(ctx.destination);const fundamentals=[92,138,184];fundamentals.forEach((freq,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),lfo=ctx.createOscillator(),lfoGain=ctx.createGain();osc.type=i===0?'triangle':'sine';osc.frequency.value=freq;gain.gain.value=i===0?.52:i===1?.22:.1;lfo.type='sine';lfo.frequency.value=25;lfoGain.gain.value=i===0?10:5;lfo.connect(lfoGain).connect(osc.frequency);osc.connect(gain).connect(filter);osc.start(now);lfo.start(now);osc.stop(now+duration+.03);lfo.stop(now+duration+.03)});const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.18;const noise=ctx.createBufferSource(),noiseFilter=ctx.createBiquadFilter(),noiseGain=ctx.createGain();noise.buffer=buffer;noiseFilter.type='bandpass';noiseFilter.frequency.value=240;noiseFilter.Q.value=.8;noiseGain.gain.value=.11;noise.connect(noiseFilter).connect(noiseGain).connect(filter);noise.start(now)}
function petCat(){if(focused!=='cat')return;catPets++;caption.textContent=catLines[(catPets-1)%catLines.length];catEffects.classList.remove('pet');void catEffects.offsetWidth;catEffects.classList.add('pet');scene.classList.remove('cat-pet');void scene.offsetWidth;scene.classList.add('cat-pet');purr();setTimeout(()=>scene.classList.remove('cat-pet'),700)}
function interact(){if(focused==='fire')tendFire();else if(focused==='cat')petCat();else if(!focused){if(selected<0)select(0);focusThing(order[selected])}}
document.querySelectorAll('.spot').forEach(s=>{s.addEventListener('click',()=>focusThing(s.dataset.id));s.addEventListener('pointerenter',()=>{selected=order.indexOf(s.dataset.id)})});back.addEventListener('click',reset);primaryAction.addEventListener('click',interact);
addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();reset()}else if(['ArrowRight','ArrowDown','d','s'].includes(e.key)){e.preventDefault();move(1)}else if(['ArrowLeft','ArrowUp','a','w'].includes(e.key)){e.preventDefault();move(-1)}else if(e.key==='Enter'||e.key===' '){e.preventDefault();interact()}});
function pollGamepad(){const pads=navigator.getGamepads?.()||[];const p=[...pads].find(Boolean);if(p){const pressed=p.buttons.map(b=>b.pressed);const edge=i=>pressed[i]&&!lastButtons[i];if(pressed.some(Boolean))wakeAudio();if(edge(1))reset();else if(edge(0))interact();if(!focused&&(edge(12)||edge(14)))move(-1);if(!focused&&(edge(13)||edge(15)))move(1);lastButtons=pressed}else lastButtons=[];requestAnimationFrame(pollGamepad)}requestAnimationFrame(pollGamepad);setTimeout(()=>hint.style.opacity=0,6500);
