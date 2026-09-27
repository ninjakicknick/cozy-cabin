import { shelf } from './library.js?v=68';

// Locations are character offsets in immutable local editions, never screen page numbers.
export class CabinReading {
  constructor(stage, memory, {save, sound, modal, wake}) {
    Object.assign(this,{memory,save,sound,modal,wake});
    this.selected=0;this.token=0;this.cache=new Map();this.history=[];
    this.dialog=document.createElement('dialog');this.dialog.id='reading';
    this.dialog.setAttribute('aria-label','The cabin bookshelf');
    this.dialog.innerHTML=`<section class="shelf-view"><h1 class="shelf-label">The books by the fire</h1><div class="book-row"></div><button class="shelf-return">Step away</button></section><section class="novel-view" hidden><header class="running-title"></header><div class="novel-spread"><div class="novel-leaf"><div class="novel-text"></div></div><div class="novel-leaf second-leaf"><div class="novel-text"></div></div></div><div class="book-ribbon" aria-hidden="true"></div><nav aria-label="Book pages"><button class="novel-prev" aria-label="Previous page">←</button><button class="novel-close">Put it back</button><button class="novel-next" aria-label="Next page">→</button></nav></section>`;
    stage.append(this.dialog);
    this.shelfView=this.dialog.querySelector('.shelf-view');this.novelView=this.dialog.querySelector('.novel-view');
    this.leaves=[...this.dialog.querySelectorAll('.novel-text')];
    this.prev=this.dialog.querySelector('.novel-prev');this.next=this.dialog.querySelector('.novel-next');
    this.buttons=shelf.map((book,i)=>{
      const b=document.createElement('button');b.className='book-spine';b.style.setProperty('--binding',book.color);
      b.style.setProperty('--book-height',`${88+(i*7)%13}%`);
      b.setAttribute('aria-label',`${book.title} — ${book.author}`);
      const title=document.createElement('span');title.textContent=book.title;
      const author=document.createElement('small');author.textContent=book.author;b.append(title,author);
      b.addEventListener('focus',()=>{this.selected=i});b.addEventListener('click',()=>this.openBook(i));
      this.dialog.querySelector('.book-row').append(b);return b;
    });
    this.dialog.querySelector('.shelf-return').onclick=()=>this.close();
    this.dialog.querySelector('.novel-close').onclick=()=>this.back();
    this.prev.onclick=()=>this.turn(-1);this.next.onclick=()=>this.turn(1);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.back()});
    this.dialog.addEventListener('click',e=>{if(e.target===this.dialog)this.back()});
    let touch;
    this.novelView.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touch=[e.clientX,e.clientY]});
    this.novelView.addEventListener('pointerup',e=>{if(touch){const dx=e.clientX-touch[0],dy=e.clientY-touch[1];if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*2)this.turn(dx<0?1:-1);touch=null}});
    this.novelView.addEventListener('pointercancel',()=>{touch=null});
    let timer;new ResizeObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{if(this.mode==='novel'&&this.data){this.history=[];this.render()}},100)}).observe(this.dialog);
  }
  get active(){return this.dialog.open}
  open(){
    this.returnFocus=document.activeElement;this.dialog.classList.toggle('firelit',this.memory.lightsOn===false);
    this.modal(true);this.showShelf();this.dialog.showModal();this.buttons[this.selected].focus();
  }
  showShelf(){
    this.token++;this.mode='shelf';this.data=null;this.dialog.classList.remove('is-novel');
    this.dialog.setAttribute('aria-label','The cabin bookshelf');this.shelfView.hidden=false;this.novelView.hidden=true;
    this.buttons[this.selected].focus();
  }
  close(){this.token++;this.dialog.close();this.modal(false);this.wake();if(this.returnFocus?.isConnected)this.returnFocus.focus();}
  back(){if(this.mode==='shelf')this.close();else{this.sound('page');this.showShelf()}}
  command(id){
    if(id==='back'){this.back();return}
    if(this.mode==='shelf'){
      if(['left','right','up','down'].includes(id)){
        const columns=innerWidth<=600?6:12;
        const delta={left:-1,right:1,up:-columns,down:columns}[id];
        this.selected=(this.selected+delta+shelf.length)%shelf.length;this.buttons[this.selected].focus();
      }else if(id==='act')this.buttons[this.selected].click();
    }else if(id==='act'||id==='right'||id==='down')this.turn(1);
    else if(id==='left'||id==='up')this.turn(-1);
  }
  async openBook(index){
    this.selected=index;const spec=shelf[index],token=++this.token;this.mode='novel';this.data=null;
    this.dialog.classList.add('is-novel');this.dialog.setAttribute('aria-label',spec.title);
    this.shelfView.hidden=true;this.novelView.hidden=false;this.prev.disabled=this.next.disabled=true;
    this.dialog.querySelector('.running-title').textContent=spec.title;
    this.leaves[0].textContent='Opening the book…';this.leaves[1].replaceChildren();
    this.dialog.querySelector('.novel-close').focus();
    try{
      let data=this.cache.get(spec.id);
      if(!data){const response=await fetch(`assets/books/${spec.id}.json`);if(!response.ok)throw Error();data=await response.json();if(typeof data.text!=='string'||data.id!==spec.id)throw Error();this.cache.set(spec.id,data)}
      if(token!==this.token||!this.active)return;
      this.data=data;this.position=Math.min(this.memory.reading[spec.id]??-1,data.text.length-1);this.history=[];
      this.sound('page');this.render();this.next.focus();
    }catch{if(token===this.token){this.leaves[0].textContent='This book has not reached the cabin yet. Connect once, then pick it up again.';}}
  }
  // Build safe DOM only. Paragraphs and verse survive; no publisher HTML runs in the cabin.
  fill(leaf,start,end){
    const text=this.data.text;leaf.replaceChildren();let at=start;
    for(const part of text.slice(start,end).split('\n\n')){
      if(part.trim()){
        const heading=this.data.headings.some(([a,b])=>at>=a&&at<b);
        const p=document.createElement(heading?'h2':'p');p.textContent=part;
        if(at>0&&text.slice(Math.max(0,at-2),at)!=='\n\n')p.classList.add('continued');
        leaf.append(p);
      }at+=part.length+2;
    }
  }
  boundary(n,forward=false){
    const t=this.data.text;n=Math.max(0,Math.min(n,t.length));
    while(n>0&&n<t.length&&!/\s/.test(t[n-1]))n+=forward?1:-1;
    return n;
  }
  fit(leaf,start){
    const text=this.data.text;let low=start,high=Math.min(text.length,start+18000);
    while(low<high){const mid=Math.ceil((low+high)/2);this.fill(leaf,start,mid);if(leaf.scrollHeight<=leaf.clientHeight+1)low=mid;else high=mid-1}
    let end=low===text.length?low:this.boundary(low);
    if(end<=start)end=this.boundary(start+1,true); // Very large accessibility text: one word, scrollable fallback.
    this.fill(leaf,start,end);return end;
  }
  visibleLeaves(){return this.leaves.filter(el=>el.parentElement.getClientRects().length)}
  render(){
    if(!this.data)return;
    this.dialog.classList.toggle('title-open',this.position<0);
    for(const leaf of this.leaves)leaf.replaceChildren();
    if(this.position<0){
      const title=document.createElement('div');title.className='novel-title-page';
      const h=document.createElement('h1');h.textContent=this.data.title;
      const a=document.createElement('p');a.textContent=this.data.author;title.append(h,a);this.leaves[0].append(title);
      this.leaves[1].textContent='';this.end=0;
    }else{
      let at=this.position;for(const leaf of this.visibleLeaves()){at=this.fit(leaf,at);leaf.scrollTop=0}this.end=at;
    }
    this.prev.disabled=this.position<0;this.next.disabled=this.end>=this.data.text.length;
    this.memory.reading[this.data.id]=this.position;this.save();
  }
  previousStart(end){
    // Reconstruct a preceding spread after reload/rotation without paginating a whole novel.
    for(const leaf of this.visibleLeaves().slice().reverse()){
      let low=Math.max(0,end-18000),high=end;
      while(low<high){const mid=Math.floor((low+high)/2);this.fill(leaf,mid,end);if(leaf.scrollHeight<=leaf.clientHeight+1)high=mid;else low=mid+1}
      end=this.boundary(low,true);
    }return end;
  }
  turn(direction){
    if(!this.data||(direction>0&&this.next.disabled)||(direction<0&&this.prev.disabled))return;
    if(direction>0){this.history.push(this.position);this.position=this.end}
    else this.position=this.history.length?this.history.pop():this.position===0?-1:this.previousStart(this.position);
    this.sound('page');this.render();
    this.novelView.getAnimations().forEach(a=>a.cancel());
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)this.novelView.animate([{opacity:.76,transform:`perspective(1400px) rotateY(${direction*1.5}deg)`},{opacity:1,transform:'none'}],{duration:220});
  }
}
