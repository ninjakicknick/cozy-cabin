const scene=document.querySelector('#scene'),caption=document.querySelector('#caption'),back=document.querySelector('#back'),hint=document.querySelector('#hint');
const things={
 books:{scale:1.9,x:10,y:31,text:'Books, old photos, and things nobody has thrown away.'},
 fire:{scale:1.72,x:24,y:60,text:'The fire is doing most of the work tonight.'},
 window:{scale:1.75,x:62,y:28,text:'Snow keeps falling beyond the glass.'},
 chair:{scale:1.65,x:54,y:58,text:'This looks like the correct place to disappear for a while.'},
 record:{scale:2,x:86,y:49,text:'The record player is waiting for something good.'},
 cat:{scale:2,x:88,y:76,text:'Absolutely unavailable for appointments.'}
};
const order=['books','fire','chair','window','record','cat']; let focused=null,selected=-1,lastButtons=[];
function transformFor(t){const dx=(50-t.x)*(t.scale-1)/t.scale,dy=(50-t.y)*(t.scale-1)/t.scale;return `scale(${t.scale}) translate(${dx}%,${dy}%)`}
function focusThing(id){const t=things[id];focused=id;scene.style.transform=transformFor(t);document.querySelectorAll('.spot').forEach(s=>s.classList.toggle('active',s.dataset.id===id));caption.textContent=t.text;caption.classList.add('show');back.classList.add('show');hint.style.opacity=0;}
function reset(){focused=null;scene.style.transform='';document.querySelectorAll('.spot').forEach(s=>s.classList.remove('active'));caption.classList.remove('show');back.classList.remove('show');}
function select(i){selected=(i+order.length)%order.length;document.querySelectorAll('.spot').forEach(s=>s.classList.toggle('selected',s.dataset.id===order[selected]));}
function move(dir){if(focused)return;if(selected<0)return select(0);select(selected+dir)}
document.querySelectorAll('.spot').forEach(s=>{s.addEventListener('click',()=>focusThing(s.dataset.id));s.addEventListener('pointerenter',()=>{selected=order.indexOf(s.dataset.id)})});back.addEventListener('click',reset);
addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();reset()}else if(['ArrowRight','ArrowDown','d','s'].includes(e.key)){e.preventDefault();move(1)}else if(['ArrowLeft','ArrowUp','a','w'].includes(e.key)){e.preventDefault();move(-1)}else if((e.key==='Enter'||e.key===' ')&&!focused){e.preventDefault();if(selected<0)select(0);focusThing(order[selected])}});
function pollGamepad(){const pads=navigator.getGamepads?.()||[];const p=[...pads].find(Boolean);if(p){const pressed=p.buttons.map(b=>b.pressed);const edge=i=>pressed[i]&&!lastButtons[i];if(edge(1)){reset()}else if(edge(0)){if(focused)reset();else{if(selected<0)select(0);focusThing(order[selected])}}if(!focused&&(edge(12)||edge(14)))move(-1);if(!focused&&(edge(13)||edge(15)))move(1);lastButtons=pressed}else lastButtons=[];requestAnimationFrame(pollGamepad)}requestAnimationFrame(pollGamepad);
setTimeout(()=>hint.style.opacity=0,6500);
