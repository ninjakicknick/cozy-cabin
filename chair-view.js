// Alternate viewpoints: sitting in the armchair, then lying on the rug by the fire.
// Kept separate from the original interaction code so viewpoint navigation stays modular.
let currentView='room';
const originalFocusThing=focusThing;
const originalReset=reset;
const originalInteract=interact;
const floorSpot=document.querySelector('#floor-spot');

ambientMix.floor={fire:.9,wind:.03};

function enterChairView(){
  currentView='chair';
  focused='chair-view';
  scene.style.transform='';
  scene.classList.remove('floor-view');
  scene.classList.add('chair-view');
  document.querySelectorAll('.spot').forEach(s=>s.classList.remove('active','selected'));
  fireEffects.className='';
  catEffects.className='';
  actionPanel.classList.remove('show');
  caption.classList.remove('show');
  back.classList.add('show');
  back.setAttribute('aria-label','Get up from the armchair');
  hint.style.opacity=0;
  mixAmbience('fire',2.4);
}

function leaveChairView(){
  currentView='room';
  focused=null;
  selected=order.indexOf('chair');
  scene.classList.remove('chair-view','floor-view');
  scene.style.transform='';
  document.querySelectorAll('.spot').forEach(s=>s.classList.toggle('selected',s.dataset.id==='chair'));
  caption.classList.remove('show');
  actionPanel.classList.remove('show');
  back.classList.remove('show');
  back.setAttribute('aria-label','Return to room');
  mixAmbience('room',2.4);
}

function enterFloorView(){
  if(currentView!=='chair')return;
  currentView='floor';
  focused='floor-view';
  scene.style.transform='';
  scene.classList.remove('chair-view');
  scene.classList.add('floor-view');
  caption.classList.remove('show');
  actionPanel.classList.remove('show');
  back.classList.add('show');
  back.setAttribute('aria-label','Sit back up by the fire');
  hint.style.opacity=0;
  mixAmbience('floor',1.6);
}

function leaveFloorView(){
  currentView='chair';
  focused='chair-view';
  scene.classList.remove('floor-view');
  scene.classList.add('chair-view');
  scene.style.transform='';
  back.classList.add('show');
  back.setAttribute('aria-label','Get up from the armchair');
  mixAmbience('fire',1.6);
}

focusThing=function(id){
  if(id==='chair'){enterChairView();return}
  originalFocusThing(id);
};

reset=function(){
  if(currentView==='floor'){leaveFloorView();return}
  if(currentView==='chair'){leaveChairView();return}
  originalReset();
};

interact=function(){
  if(currentView==='floor'||currentView==='chair')return;
  if(!focused&&selected>=0&&order[selected]==='chair'){enterChairView();return}
  originalInteract();
};

floorSpot.addEventListener('click',enterFloorView);

// The original back listener captured the old reset function, so intercept alternate-view exits first.
back.addEventListener('click',e=>{
  if(currentView==='floor'){
    e.preventDefault();
    e.stopImmediatePropagation();
    leaveFloorView();
    return;
  }
  if(currentView==='chair'){
    e.preventDefault();
    e.stopImmediatePropagation();
    leaveChairView();
  }
},true);
