// First alternate viewpoint: sitting in the armchair.
// Kept separate from the original interaction code while we prove the viewpoint model.
let currentView='room';
const originalFocusThing=focusThing;
const originalReset=reset;
const originalInteract=interact;

function enterChairView(){
  currentView='chair';
  focused='chair-view';
  scene.style.transform='';
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
  scene.classList.remove('chair-view');
  scene.style.transform='';
  document.querySelectorAll('.spot').forEach(s=>s.classList.toggle('selected',s.dataset.id==='chair'));
  caption.classList.remove('show');
  actionPanel.classList.remove('show');
  back.classList.remove('show');
  back.setAttribute('aria-label','Return to room');
  mixAmbience('room',2.4);
}

focusThing=function(id){
  if(id==='chair'){enterChairView();return}
  originalFocusThing(id);
};

reset=function(){
  if(currentView==='chair'){leaveChairView();return}
  originalReset();
};

interact=function(){
  if(currentView==='chair')return;
  if(!focused&&selected>=0&&order[selected]==='chair'){enterChairView();return}
  originalInteract();
};

// The original back listener captured the old reset function, so intercept chair exits first.
back.addEventListener('click',e=>{
  if(currentView!=='chair')return;
  e.preventDefault();
  e.stopImmediatePropagation();
  leaveChairView();
},true);
