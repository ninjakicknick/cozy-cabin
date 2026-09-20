import { Telescope } from './telescope.js?v=66';
import { clockAction, canEnter } from './clock.js?v=66';
import { teaWarmth, rememberTea } from './rhythms.js?v=66';
import { CabinAudio } from './audio.js?v=66';
import { scenes,actionLabel,visibleSpots } from './world.js?v=66';
import { readMemory,saveMemory,parentView,neighbor,navigationPoints,kettleState,createVisit,advanceWorld,weatherAt } from './state.js?v=66';
import { gamepadCommands } from './input.js?v=66';
import { CabinRenderer } from './renderer.js?v=66';
import { notebook,paper as paperContent } from './stories.js?v=66';
const $=s=>document.querySelector(s),stage=$('#stage'),scene=$('#scene'),hotspots=$('#hotspots'),actions=$('#actions');
const book=$('#book'),paper=$('#paper');let storage;try{storage=new URLSearchParams(location.search).get('testVisit')==='clock'?{getItem:()=>sessionStorage.getItem('cozy-cabin.test.clock.'+(new URLSearchParams(location.search).get('slot')||'default')),setItem:(_,v)=>sessionStorage.setItem('cozy-cabin.test.clock.'+(new URLSearchParams(location.search).get('slot')||'default'),v)}:localStorage}catch{}
const memory=readMemory(storage);memory.visits++;saveMemory(storage,memory);
const visit=createVisit(Date.now()^memory.visits,memory);
if(memory.recordOn&&!memory.life.recordAt)memory.life.recordAt=Date.now();
const arrival=memory.life.lastRest&&canEnter(memory.life.lastRest,memory)&&Date.now()-memory.life.lastSeen<20*60000?memory.life.lastRest:'room';
const state={view:'room',selected:null,input:'pointer',idle:false,page:memory.page,modal:null,loading:false,actionIndex:0,openingMenu:false};
const renderer=new CabinRenderer(scene,$('#weather'));
const telescope=new Telescope($('#telescope'),memory,()=>wake(),()=>save(true));
const audio=new CabinAudio(ok=>{stage.dataset.audio=ok?'ready':'retry';$('#sound').title=ok?'Sound · M':'Sound could not start. Tap to retry.'});
let idleTimer,captionTimer,lastFrame=performance.now(),lastTick=0,petUntil=0,goToken=0,controller={},lastSaveAt=0;
let lastSaved=JSON.stringify(memory),currentWeather=weatherAt(Date.now(),memory.life.seed);
function save(force=false){const now=Date.now();if(!force&&now-lastSaveAt<30000)return;memory.life.lastSeen=now;const next=JSON.stringify(memory);if(next!==lastSaved){saveMemory(storage,memory);lastSaved=next}lastSaveAt=now}
function say(text,duration=4200){clearTimeout(captionTimer);$('#caption').textContent=text;$('#caption').classList.toggle('show',Boolean(text));captionTimer=setTimeout(()=>$('#caption').classList.remove('show'),duration)}
function wake(){state.idle=false;stage.classList.remove('idle');clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(state.modal||state.loading)return;state.idle=true;stage.classList.add('idle')},4800)}
function syncAudio(){audio.mix(state.view,{...memory,weatherWind:currentWeather.wind,listening:visit.elapsed<visit.listeningUntil})}
function updateSelected(){
  for(const button of hotspots.querySelectorAll('button'))button.classList.toggle('selected',state.input!=='pointer'&&button.dataset.id===state.selected);
  for(const [i,button] of [...actions.children].entries())button.classList.toggle('selected',state.input!=='pointer'&&(scenes[state.view].spots?state.selected===`action:${button.dataset.action}`:i===state.actionIndex));
}
function availableActions(){const spec=scenes[state.view];return [...(spec.actions||[]),...(state.view==='clockWall'&&state.openingMenu&&memory.panelOpen?['enterSecret','closePanel']:[]),...(spec.rest&&teaWarmth(memory)>0?['sip']:[])]}
function renderControls(){
  state.actionIndex=Math.min(state.actionIndex,Math.max(0,availableActions().length-1));
  const spec=scenes[state.view];if(spec.spots&&!navigationPoints(state.view,availableActions(),memory)[state.selected])state.selected=spec.default;hotspots.replaceChildren();actions.replaceChildren();
  for(const item of visibleSpots(state.view,memory)){
    const button=document.createElement('button');button.className=`spot${item.edge?' edge':''}`;button.dataset.id=item.id;if(item.x>80)button.classList.add('label-left');if(item.x<15)button.classList.add('label-right');button.setAttribute('aria-label',item.label);
    button.style.cssText=`--x:${item.x}%;--y:${item.y}%;--w:${item.w||8}%;--h:${item.h||13}%;`;
    const label=document.createElement('span');label.textContent=item.label;button.append(label);
    if(item.edge){const mark=document.createElement('b');mark.textContent=item.id==='kitchen'&&state.view==='room'?'↶':'‹';mark.setAttribute('aria-hidden','true');button.append(mark)}
    button.addEventListener('pointerenter',()=>{state.selected=item.id;updateSelected()});
    button.addEventListener('click',()=>{state.selected=item.id;activate(item)});hotspots.append(button);
  }
  for(const id of availableActions()){const button=document.createElement('button');button.className='quiet-control';button.dataset.action=id;button.textContent=actionLabel(id,memory);button.addEventListener('click',()=>perform(id));actions.append(button)}
  actions.hidden=!availableActions().length;$('#back').hidden=state.view==='room';$('#back').setAttribute('aria-label',['floor','snugRest'].includes(state.view)?'Sit back up':`Back — ${scenes[parentView(state.view)].label}`);
  $('#sound').textContent=memory.muted?'Sound off':'Sound on';$('#sound').setAttribute('aria-pressed',String(!memory.muted));updateSelected();
}
function refresh(){
  $('#lights').textContent=memory.lightsOn?'Lights on':'Lights off';$('#lights').setAttribute('aria-label',memory.lightsOn?'Turn off the lights':'Turn on the lights');$('#lights').setAttribute('aria-pressed',String(memory.lightsOn));
  if(memory.kettleAt&&Date.now()-memory.kettleAt>600000)memory.kettleAt=0;
  if([...actions.children].map(b=>b.dataset.action).join(',')!==availableActions().join(','))renderControls();
  for(const button of actions.children)button.textContent=actionLabel(button.dataset.action,memory);
  $('#sound').textContent=memory.muted?'Sound off':'Sound on';$('#sound').setAttribute('aria-pressed',String(!memory.muted));
  renderer.environment(memory,visit,currentWeather);stage.dataset.weather=currentWeather.name;stage.dataset.time=currentWeather.phase;
  stage.classList.toggle('settled',visit.settled);stage.classList.toggle('familiar',visit.settled&&(visit.familiar[state.view]||0)>120);
  stage.classList.toggle('wrapped',(state.view==='porchSeat'&&memory.blanket)||(state.view==='bed'&&memory.quilt));
  save();syncAudio();
}
async function go(view){
  if(!scenes[view]||!canEnter(view,memory))return;const token=++goToken;state.loading=true;stage.setAttribute('aria-busy','true');wake();
  try{
    if(view==='telescope')await telescope.load();
    if(token!==goToken||!await renderer.show(view)||token!==goToken)return;
    telescope.show(view==='telescope');
    const previous=state.view;state.view=view;state.actionIndex=0;state.openingMenu=false;state.selected=scenes[view].default||null;visit.still=0;
    if(previous!==view)audio.sound(['porch','mudroom','snug'].includes(view)?'wood':'step');
    closeModal(false);say('');stage.dataset.view=view;stage.setAttribute('aria-label',scenes[view].label);
    $('#scope-mask').hidden=!scenes[view].scope;
    if(view==='telescope'&&!telescope.hinted){telescope.hinted=true;say('Drag gently to look around. Arrow keys work too.',6000)}
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
    renderControls();refresh();
  }catch{say('That part of the cabin could not load. Try again in a moment.')}
  finally{if(token===goToken){state.loading=false;stage.removeAttribute('aria-busy');wake()}}
}
function closeModal(restore=true){
  if(book.open)book.close();if(paper.open)paper.close();state.modal=null;
  if(restore){wake();document.activeElement?.blur?.()}
}
function back(){if(state.modal){closeModal();return}if(state.view!=='room')go(parentView(state.view))}
function renderPage(){
  const [title,text]=notebook[state.page];$('#page-title').textContent=title;$('#page-text').textContent=text;
  $('#page-number').textContent=String(state.page+1).padStart(2,'0');$('#previous-page').disabled=state.page===0;$('#next-page').disabled=state.page===notebook.length-1;
  const note=memory.life.signalCount>=3?'Not an answer every night. But the same pause between the lights.':memory.signalSeen?'I left the light on again.':memory.listened?'There is no road on that side of the lake.':'';
  $('#margin-note').textContent=note;$('#margin-note').hidden=!(state.page===2&&note);memory.page=state.page;save(true);
}
function turnPage(dir){const next=Math.max(0,Math.min(notebook.length-1,state.page+dir));if(next===state.page)return;state.page=next;audio.sound('page');renderPage()}
function openPaper(id){
  const content=paperContent(id,memory);if(!content)return;state.modal=id;
  $('#paper-title').textContent=content.title;$('#paper-text').textContent=content.text;$('#paper-footer').textContent=content.footer;
  $('#paper-turn').hidden=!(id==='tin');$('#paper-turn').textContent='Wind the small mechanism';
  if(!paper.open)paper.showModal();$('#close-paper').focus();audio.sound('page');
}
function activate(item){if(state.loading)return;wake();audio.wake();if(item.go)go(item.go);else perform(item.do)}
function act(){
  if(state.loading)return;wake();audio.wake();
  if(state.modal==='book'){turnPage(state.page===notebook.length-1?-state.page:1);return}
  if(state.modal){if(state.modal==='tin'){closeModal();perform('musicbox')}else closeModal();return}
  const spec=scenes[state.view];if(spec.spots&&state.selected?.startsWith('action:')){perform(state.selected.slice(7));return}if(spec.spots?.length){const spots=visibleSpots(state.view,memory);const item=spots.find(s=>s.id===state.selected)||spots.find(s=>s.id===spec.default)||spots[0];if(item)activate(item)}
  else if(availableActions().length)perform(availableActions()[state.actionIndex]||availableActions()[0]);
}
async function perform(id){
  if(state.loading)return;
  wake();audio.wake();const now=Date.now();
  switch(id){
    case 'clockView':go('clockWall');return;
    case 'key':case 'clock':{
      const result=clockAction(memory,id);save(true);
      if(result.sound)audio.sound(result.sound,false);say(result.text||'');
      if(result.reveal){
        const token=goToken;state.loading=true;stage.setAttribute('aria-busy','true');
        refresh();
        try{await renderer.reveal();}finally{if(goToken===token){state.loading=false;stage.removeAttribute('aria-busy');state.selected='passage';renderControls();wake()}}
      }else{renderControls();refresh()}
      return;
    }
    case 'opening':
      if(!memory.panelOpen){memory.panelOpen=true;audio.sound('wood');say('The hidden panel swings inward.');break}
      state.openingMenu=true;state.selected='action:enterSecret';renderControls();return;
    case 'enterSecret':state.openingMenu=false;go('snug');return;
    case 'closePanel':memory.panelOpen=false;state.openingMenu=false;audio.sound('wood');say('The panel settles flush with the wall.');break;
    case 'lantern':memory.lanternTurning=!memory.lanternTurning;audio.sound('winding');break;
    case 'toneLow':case 'toneMiddle':case 'toneHigh':audio.sound(id,false);renderer.ring(id);break;
    case 'book':state.modal='book';renderPage();book.showModal();$('#next-page').focus();audio.sound('page');break;
    case 'window':memory.windowOpen=!memory.windowOpen;audio.sound('wood');say(memory.windowOpen?'Cold air. The scent of pine.':'Warmth gathers behind the glass.');break;
    case 'look':go('windowLake');break;
    case 'record':memory.recordOn=!memory.recordOn;if(memory.recordOn)memory.life.recordAt=now;audio.sound('needle');say(memory.recordOn?(memory.recordSide?'Before the road.':'The long way home.'):'The needle comes to rest.');break;
    case 'flip':memory.recordSide=1-memory.recordSide;memory.life.recordAt=now;audio.sound('page');say(memory.recordSide?'On the other side, a name in blue pencil.':'The plain label faces up again.');break;
    case 'tend':if(memory.emberUntil>now){say('It has everything it needs.');break}memory.emberUntil=now+20*60e3;audio.sound('wood');say('The new wood catches slowly.');break;
    case 'pet':if(now<petUntil)return;petUntil=now+2400;memory.catPets++;audio.sound('purr');say(memory.catPets%3===0?'A tiny chirp. Then an ear turns toward the kitchen.':['A paw uncurls. Then a purr.','You may stay.'][memory.catPets%2]);break;
    case 'kettle':{
      const status=kettleState(memory,now);if(status==='ready'){perform('tea');return}
      if(status==='warming'){say('A faint trembling beneath the lid.');break}
      memory.kettleAt=now;audio.sound('cup');say('You set the kettle on the warm plate.');break;}
    case 'tea':if(kettleState(memory,now)==='ready'){rememberTea(memory,now);memory.kettleAt=0;audio.sound('cup');say(memory.life.teaDays>2?'Your hands remember where everything is.':'Two cups. Just in case.');}else say(teaWarmth(memory)>0?'A little warmth left in the cup.':'The mugs are cool to the touch.');break;
    case 'porchLamp':memory.porchLamp=!memory.porchLamp;audio.sound('needle');say(memory.porchLamp?'The porch fills with amber light.':'The lake seems a little closer.');break;
    case 'lamp':memory.loftLamp=!memory.loftLamp;audio.sound('needle');break;
    case 'blanket':memory.blanket=!memory.blanket;audio.sound('page');say(memory.blanket?'The wool holds the warmth.':'Cold air touches your hands.');break;
    case 'quilt':memory.quilt=!memory.quilt;audio.sound('page');say(memory.quilt?'The roof creaks softly above you.':'You fold it neatly at your feet.');break;
    case 'listen':say('');visit.listeningUntil=visit.elapsed+45;break;
    case 'sip':if(now-memory.life.sippedAt<8000){say('You hold the cup a little longer.');break}memory.life.sippedAt=now;memory.life.teaPlace=state.view;audio.sound('cup');say(teaWarmth(memory)>.65?'Still a little too hot.':teaWarmth(memory)>.25?'Just warm enough.':'The last sip has gone cool.');break;
    case 'chime':audio.sound('chime',false);scene.classList.remove('chime-touched');void scene.offsetWidth;scene.classList.add('chime-touched');break;
    case 'bowl':memory.birdAt=now;memory.life.fedAt=now;audio.sound('page');say('A few seeds beneath the snow.');break;
    case 'scope':memory.telescope.sharp=!memory.telescope.sharp;audio.sound('needle');break;
    case 'compass':audio.sound('needle');say(memory.postcardRead?'The needle settles toward the lake. It takes its time.':'The brass is warm. The needle is in no hurry.');break;
    case 'scarf':memory.scarfTouches++;if(memory.scarfTouches>=3)openPaper('scarf');else{audio.sound('page');say(memory.scarfTouches===1?'The wool smells faintly of cedar.':'A loose stitch catches against your thumb.')}break;
    case 'postcard':memory.postcardRead=true;openPaper(id);break;
    case 'letter':memory.letterRead=true;openPaper(id);break;
    case 'tin':memory.tinVisits++;openPaper(id);break;
    case 'musicbox':memory.musicbox=!memory.musicbox;visit.musicUntil=visit.elapsed+20;visit.nextMusic=visit.elapsed+6;if(memory.musicbox)audio.sound('musicbox',false);else audio.sound('needle');break;
    case 'boat':memory.boatMoved=!memory.boatMoved;audio.sound('wood');say(memory.boatMoved?'You turn the little bow toward the window.':'It fits the old mark in the dust.');break;
    case 'recipe':case 'bench':case 'photograph':openPaper(id);break;
  }
  refresh();save(true);audio.wake();
}
function navigate(dx,dy){
  wake();if(state.loading)return;
  if(state.modal==='book'){if(dx)turnPage(dx);return}if(state.modal)return;
  document.activeElement?.blur?.();
  if(state.view==='telescope'){return}
  const spec=scenes[state.view];if(spec.spots){const points=navigationPoints(state.view,availableActions(),memory);state.selected=neighbor(state.selected,dx,dy,points,spec.default)}
  else if(availableActions().length>1){state.actionIndex=(state.actionIndex+(dx||dy)+availableActions().length)%availableActions().length}
  updateSelected();
}
function toggleLights(){
  if(state.loading||state.modal)return;
  memory.lightsOn=!memory.lightsOn;memory.loftLamp=memory.lightsOn;memory.porchLamp=memory.lightsOn;
  wake();audio.wake();audio.sound('needle');refresh();save(true);
}
function mute(){memory.muted=!memory.muted;refresh();save(true);audio.wake()}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen()}catch{say('Fullscreen is not available in this browser.')}}
function command(id){const dirs={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};if(dirs[id])navigate(...dirs[id]);else if(id==='back')back();else if(id==='act')act();else if(id==='mute')mute();else if(id==='lights')toggleLights();else if(id==='secondary'){const secondary=availableActions()[1];if(!state.modal&&secondary)perform(secondary)}}
$('#lights').addEventListener('click',toggleLights);$('#back').addEventListener('click',back);$('#sound').addEventListener('click',mute);$('#fullscreen').addEventListener('click',fullscreen);
$('#close-book').addEventListener('click',()=>closeModal());$('#close-paper').addEventListener('click',()=>closeModal());
$('#previous-page').addEventListener('click',()=>turnPage(-1));$('#next-page').addEventListener('click',()=>turnPage(1));
$('#paper-turn').addEventListener('click',()=>{closeModal();perform('musicbox')});
for(const dialog of [book,paper]){dialog.addEventListener('cancel',event=>{event.preventDefault();closeModal()});dialog.addEventListener('click',event=>{if(event.target===dialog)closeModal()})}
addEventListener('pointermove',()=>{state.input='pointer';wake();updateSelected()},{passive:true});
addEventListener('pointerdown',()=>{state.input='pointer';wake();audio.wake()},{passive:true});
addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;state.input='keyboard';wake();audio.wake();
  const key=event.key.toLowerCase(),mapping={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down',escape:'back',backspace:'back',m:'mute',l:'lights',x:'secondary'};
  if(!state.modal&&!state.loading&&telescope.key(key)){event.preventDefault();return}
  if(mapping[key]){event.preventDefault();if(!event.repeat||['left','right','up','down'].includes(mapping[key]))command(mapping[key])}
  else if(key==='f'){if(!event.repeat)fullscreen()}
  else if(key==='enter'||key===' '){if(event.target instanceof HTMLButtonElement&&!event.target.hidden)return;event.preventDefault();if(!event.repeat)act()}
});
addEventListener('visibilitychange',()=>{lastFrame=performance.now();if(document.hidden)save(true);else{currentWeather=weatherAt(Date.now(),memory.life.seed);refresh()}});
addEventListener('pagehide',()=>save(true));
addEventListener('fullscreenchange',()=>{$('#fullscreen').textContent=document.fullscreenElement?'Leave fullscreen':'Fullscreen'});
function frame(now){
  const dt=(now-lastFrame)/1000;lastFrame=now;
  if(!document.hidden){
    const events=advanceWorld(visit,memory,state.view,dt,Date.now(),!state.modal&&!state.loading);
    for(const event of events){if(typeof event==='string')audio.sound(event,false);else if(!state.modal&&!$('#caption').classList.contains('show'))say(event.text,5500)}
    if(now-lastTick>1000){lastTick=now;currentWeather=weatherAt(Date.now(),memory.life.seed);refresh()}
    renderer.drawSnow(now);renderer.drawLantern(now,memory);
    let pad;try{pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected)}catch{}
    telescope.signal=visit.elapsed<visit.signalUntil;
    telescope.update(dt,now,state.loading||state.modal?null:pad);
    const result=gamepadCommands(pad,controller,now);controller=result.state;
    if(result.commands.length){state.input='gamepad';wake();audio.wake();for(const id of result.commands)command(id);updateSelected()}
  }
  requestAnimationFrame(frame);
}
syncAudio();
renderer.load(scenes[arrival].art).then(()=>go(arrival)).catch(()=>say('The cabin could not load. Please refresh.'));
requestAnimationFrame(frame);
