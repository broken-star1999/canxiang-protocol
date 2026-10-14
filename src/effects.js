/* Presentation only: animations never delay or mutate story state. */
const icons={
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 evidence:'<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 fullscreen:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 echo:'<path d="M2 12h4l3-7 5 14 3-7h5"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
export function icon(name){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.4');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');s.setAttribute('aria-hidden','true');s.innerHTML=icons[name]||icons.echo;return s;}
const text=(tag,value,className)=>{const n=document.createElement(tag);n.textContent=value;if(className)n.className=className;return n;};

export class Effects {
 constructor(sound){this.sound=sound;this.active=new Set();this.portraits=new Map();this.choiceGhost=null;this.notice=null;this.saveStamp=0;this.bind();this.decorate();this.cursor();}
 reduced(){return document.body.classList.contains('reduced')||matchMedia('(prefers-reduced-motion: reduce)').matches;}
 animate(element,frames,options={}){if(!element||this.reduced()||document.hidden)return null;const a=element.animate(frames,{duration:330,fill:'backwards',easing:'cubic-bezier(.22,.8,.25,1)',...options});this.active.add(a);a.finished.then(()=>this.active.delete(a),()=>this.active.delete(a));return a;}
 cancel(){for(const a of this.active)a.cancel();this.active.clear();document.querySelectorAll(".cursor-star").forEach(n=>n.hidden=true);document.querySelectorAll(".portrait-echo").forEach(n=>n.hidden=true);this.choiceGhost?.remove();}
 decorate(){document.querySelectorAll('.icon-button[data-action]').forEach(b=>{const name=b.dataset.action;if(icons[name])b.replaceChildren(icon(name));});const wave=document.querySelector('#titleWave');if(wave){for(let i=0;i<35;i++){const bar=document.createElement('i');bar.style.setProperty('--bar-height',(5+Math.round(Math.sin(i*.61)**2*(10+18*Math.sin(i/34*Math.PI))))+'px');bar.style.setProperty('--bar-delay',(-i*.095)+'s');bar.style.setProperty('--bar-duration',(1.5+(i%5)*.13)+'s');wave.append(bar);}}const motif=document.querySelector('#worldMotes');if(motif){for(let i=0;i<12;i++){const dot=document.createElement('i');dot.style.setProperty('--x',((i*37+11)%100)+'%');dot.style.setProperty('--y',((i*19+24)%95)+'%');dot.style.setProperty('--drift-delay',(-i*1.7)+'s');motif.append(dot);}}}
 bind(){document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b||b.disabled||this.reduced())return;const r=b.getBoundingClientRect(),ripple=document.createElement('span');ripple.className='press-ripple';ripple.style.left=(e.clientX-r.left)+'px';ripple.style.top=(e.clientY-r.top)+'px';b.append(ripple);const a=this.animate(ripple,[{transform:'translate(-50%,-50%) scale(.15)',opacity:.28},{transform:'translate(-50%,-50%) scale(3)',opacity:0}],{duration:520});if(a)a.finished.finally(()=>ripple.remove()).catch(()=>{});else ripple.remove();if(b.id!=='dialogue'&&!b.dataset.choice){this.sound.unlock();this.sound.ui?.();}}, {passive:true});}
 cursor(){
  const layer=document.querySelector('#cursorStars');if(!layer)return;
  // Interpolate short mouse segments, so a quick curve does not become spaced stamps.
  let stamp=0,last=null,index=0;
  const pool=Array.from({length:48},()=>{const n=document.createElement('i');n.className='cursor-star';n.hidden=true;layer.append(n);return n;});
  const reset=()=>{last=null;};
  document.addEventListener('pointerleave',reset);
  document.addEventListener('visibilitychange',reset);
  document.addEventListener('pointermove',e=>{
   if(e.pointerType!=='mouse'||!matchMedia('(any-hover: hover) and (any-pointer: fine)').matches||this.reduced()||document.hidden){reset();return;}
   const now=performance.now();if(now-stamp<16)return;
   const point={x:e.clientX,y:e.clientY},origin=last||point;
   const dx=point.x-origin.x,dy=point.y-origin.y,distance=Math.hypot(dx,dy);
   if(last&&distance<4)return;
   stamp=now;last=point;
   const count=distance>180?1:Math.min(6,Math.max(1,Math.ceil(distance/8)));
   for(let i=1;i<=count;i++){
    const n=pool[index++%pool.length],spark=index%7===0,t=distance>180?1:i/count;
    n.getAnimations().forEach(a=>a.cancel());const token=Symbol();n.motionToken=token;
    n.className='cursor-star'+(spark?' spark':'');n.hidden=false;
    n.style.left=(origin.x+dx*t)+'px';n.style.top=(origin.y+dy*t)+'px';
    const size=spark?40:34+(index%3)*4;n.style.width=n.style.height=size+'px';
    const driftX=Math.max(-10,Math.min(10,dx*.12))+(index%3-1)*2;
    const driftY=Math.max(-10,Math.min(10,dy*.12))+(spark?-6:2);
    const move=(scale,x=0,y=0)=>`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(${scale})`;
    const animation=this.animate(n,[
     {opacity:0,transform:move(.65)},
     {opacity:spark?.95:.85,offset:.08,transform:move(1)},
     {opacity:spark?.6:.45,offset:.45,transform:move(.9,driftX*.5,driftY*.5)},
     {opacity:0,transform:move(.3,driftX,driftY)}
    ],{duration:spark?900:650,easing:'cubic-bezier(.2,.65,.35,1)'});
    const hide=()=>{if(n.motionToken===token)n.hidden=true;};animation?.finished.then(hide,hide);
   }
  },{passive:true});
 }

 title(){const title=document.querySelector('#titleScreen');this.animate(title.querySelector('.title-copy'),[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:900});this.animate(title.querySelector('.title-character'),[{opacity:0,transform:'translateX(30px)'},{opacity:1,transform:'translateX(0)'}],{duration:1200});title.querySelectorAll('.title-menu>button,.menu-secondary').forEach((n,i)=>this.animate(n,[{opacity:0,transform:'translateX(-15px)'},{opacity:1,transform:'translateX(0)'}],{duration:650,delay:180+i*80}));}
 scene(bg,changed){document.body.dataset.environment=bg;if(changed){const area=document.querySelector('#sceneArrival');if(area){area.textContent=document.querySelector('#place')?.textContent||'';this.animate(area,[{opacity:0,transform:'translate(-50%,6px)'},{opacity:.9,offset:.25},{opacity:.9,offset:.65},{opacity:0,transform:'translate(-50%,-3px)'}],{duration:2200});}this.animate(document.querySelector('.place-label'),[{opacity:.2,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}],{duration:650});}}
 portrait(slot,src,identity){const main=slot.querySelector('.portrait-main'),ghost=slot.querySelector('.portrait-echo');if(slot.dataset.src===src)return;const token=(this.portraits.get(slot)?.token||0)+1;const record={token,src};this.portraits.set(slot,record);const wasVisible=slot.dataset.identity===identity&&main.getAttribute('src');slot.dataset.src=src;slot.dataset.identity=identity;const image=new Image();image.src=src;const apply=()=>{if(this.portraits.get(slot)!==record)return;main.getAnimations().forEach(a=>a.cancel());ghost.getAnimations().forEach(a=>a.cancel());if(wasVisible&&main.getAttribute('src')){ghost.src=main.src;ghost.hidden=this.reduced();}else ghost.hidden=true;main.src=src;if(!this.reduced()){this.animate(main,[{opacity:0,transform:wasVisible?'translateY(2px)':'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:wasVisible?230:450});if(!ghost.hidden){const a=this.animate(ghost,[{opacity:1},{opacity:0}],{duration:230});a?.finished.then(()=>{if(this.portraits.get(slot)===record)ghost.hidden=true;},()=>{});}}};if(image.complete&&image.naturalWidth)apply();else image.decode().then(apply,()=>{if(this.portraits.get(slot)===record){main.src=src;ghost.hidden=true;}});}
 speaker(name,changed){document.body.dataset.speaker=name;if(changed)this.animate(document.querySelector('#speaker'),[{opacity:.35,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:240});}
 choices(){document.querySelectorAll('#choiceButtons>button').forEach((b,i)=>{this.animate(b,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:340,delay:i*45});if(b.disabled&&!b.querySelector('.choice-lock')){const lock=icon('lock');lock.classList.add('choice-lock');b.append(lock);}});}
 choice(button,label){if(this.reduced())return;this.choiceGhost?.remove();if(!button)return;const r=button.getBoundingClientRect();if(!r.width)return;const ghost=document.createElement('div');ghost.className='decision-ghost';ghost.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;min-height:${r.height}px`;ghost.append(icon('echo'),text('span',label));document.body.append(ghost);this.choiceGhost=ghost;const a=this.animate(ghost,[{opacity:1,transform:'scale(1)'},{opacity:1,offset:.28,transform:'scale(1.025)'},{opacity:0,transform:'scale(1.04) translateY(-8px)'}],{duration:660});a?.finished.then(()=>ghost.remove(),()=>ghost.remove());}
 panel(){this.animate(document.querySelector('#panel'),[{opacity:.5,transform:'translateY(12px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:240});const children=[...document.querySelector('#panelBody').children];children.slice(0,6).forEach((n,i)=>this.animate(n,[{opacity:.5,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,delay:i*25}));}
 ending(){const end=document.querySelector('#endingScreen');this.animate(end,[{opacity:0},{opacity:1}],{duration:1000});[end.querySelector('.eyebrow'),end.querySelector('h2'),end.querySelector('p'),end.querySelector('.ending-summary'),end.querySelector('.ending-actions')].forEach((n,i)=>this.animate(n,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay:160+i*130}));}
 reward(kind,title,description){clearTimeout(this.noticeTimer);this.notice?.remove();const card=document.createElement('button');card.type='button';card.className='reward-notice '+kind;card.dataset.action=kind==='evidence'?'evidence':'archive';card.setAttribute('aria-label',title+'，打开档案');const seal=document.createElement('div');seal.className='reward-seal';seal.append(icon(kind==='evidence'?'evidence':'echo'));const copy=document.createElement('div');copy.append(text('small',kind==='evidence'?'证据已入档':'回响已留下'),text('strong',title),text('span',description||'查看档案 →'));card.append(seal,copy);document.querySelector('#rewardLayer').append(card);this.notice=card;this.animate(card,[{opacity:0,transform:'translateX(-16px)'},{opacity:1,transform:'translateX(0)'}],{duration:450});this.noticeTimer=setTimeout(()=>{const a=this.animate(card,[{opacity:1},{opacity:0,transform:'translateX(-8px)'}],{duration:280});if(a)a.finished.then(()=>card.remove(),()=>card.remove());else card.remove();},3500);}
 saved(manual=false){const indicator=document.querySelector('#saveIndicator');if(!indicator)return;indicator.dataset.status=manual?'manual':'saved';indicator.setAttribute('aria-label',manual?'手动存档已保存':'进度已自动保存');if(manual||Date.now()-this.saveStamp>20000){this.saveStamp=Date.now();this.animate(indicator,[{opacity:.35},{opacity:1,offset:.4},{opacity:.6}],{duration:850});}}
 clear(){this.notice?.remove();this.choiceGhost?.remove();clearTimeout(this.noticeTimer);}
}
