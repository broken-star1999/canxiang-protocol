import {clone,matches,chapterFor} from './engine.js?v=3.3';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(label,fn,cls)=>{const b=el('button',label,cls);b.type='button';b.onclick=fn;return b;};
const targets=t=>typeof t==='string'?[t]:Array.isArray(t)?t.map(x=>x.to):[];
export function graphLayout(story,chapter){
 const ids=chapter.scenes,allowed=new Set(ids),edges=[];
 for(const id of ids){const s=story.scenes[id];for(const to of new Set([...targets(s.next),...(s.choices||[]).flatMap(c=>targets(c.next))]))if(allowed.has(to))edges.push({from:id,to});}
 const indegree=Object.fromEntries(ids.map(id=>[id,0])),level=Object.fromEntries(ids.map(id=>[id,0]));edges.forEach(e=>indegree[e.to]++);
 const queue=ids.filter(id=>!indegree[id]);let count=0;
 while(queue.length){const id=queue.shift();count++;for(const e of edges.filter(e=>e.from===id)){level[e.to]=Math.max(level[e.to],level[id]+1);if(--indegree[e.to]===0)queue.push(e.to);}}
 if(count!==ids.length)throw Error('剧情图存在循环');
 const groups=[];ids.forEach(id=>(groups[level[id]]||=[]).push(id));const rows=Math.max(1,...groups.map(x=>x.length)),height=Math.max(420,rows*170+100),positions={};
 groups.forEach((group,x)=>group.forEach((id,i)=>positions[id]={x:70+x*235,y:45+(i+.5)*(height-90)/group.length-55}));
 return {edges,positions,width:groups.length*235+150,height};
}

export function openFlow(game,chapterId){
 const saved=game.state||game.saves.data.auto;
 const chapter=game.story.chapters.find(c=>c.id===(chapterId||saved?.chapter))||game.story.chapters[0];
 const body=game.openPanel('故事线 · 回到另一种回答','STORY FLOW');body.classList.add('flow-panel');
 const known=new Set(game.saves.data.collection.nodes||[]),seenEdges=new Set(game.saves.data.collection.edges||[]),current=new Set((saved?.path||[]).slice(1).map((to,i)=>saved.path[i]+'>'+to));
 const tabs=el('div',undefined,'flow-chapters');game.story.chapters.forEach(c=>{const unlocked=c.number===1||game.saves.data.collection.chapters.includes(c.id);const b=button(unlocked?`${String(c.number).padStart(2,'0')} ${c.title}`:`${String(c.number).padStart(2,'0')} 未抵达`,()=>openFlow(game,c.id),c.id===chapter.id?'active':'');b.disabled=!unlocked;tabs.append(b);});
 const count=chapter.scenes.filter(id=>known.has(id)).length;
 const toolbar=el('div',undefined,'flow-toolbar');toolbar.append(el('span',`本章探索 ${count} / ${chapter.scenes.length} · ${Math.round(count/chapter.scenes.length*100)}%`),el('small','实线：本次路线 · 虚线：其他分支 · 未知节点隐藏内容'));
 const layout=graphLayout(game.story,chapter),shell=el('div',undefined,'flow-shell'),scroll=el('div',undefined,'flow-scroll'),sizer=el('div',undefined,'flow-sizer'),world=el('div',undefined,'flow-world'),detail=el('aside',undefined,'flow-detail');
 world.style.width=layout.width+'px';world.style.height=layout.height+'px';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width',layout.width);svg.setAttribute('height',layout.height);svg.setAttribute('aria-hidden','true');
 for(const edge of layout.edges){const a=layout.positions[edge.from],b=layout.positions[edge.to],key=edge.from+'>'+edge.to,path=document.createElementNS(svg.namespaceURI,'path');const x=a.x+166,y=a.y+55,tx=b.x,ty=b.y+55;path.setAttribute('d',`M ${x} ${y} C ${x+35} ${y}, ${tx-35} ${ty}, ${tx} ${ty}`);path.setAttribute('class',current.has(key)?'flow-edge current':seenEdges.has(key)?'flow-edge explored':'flow-edge');svg.append(path);}world.append(svg);
 let selected=null,zoom=.85;
 const replay=async(point,choice)=>{if(!await game.confirm('从这里改走另一条路线？','恢复该节点原有的证据、关系与记忆状态。其后的当前路线重新生成；已经探索的节点和结局保留。'))return;const state=clone(point.state);state.ending=null;state.flags.finished=false;game.load(state);if(choice){game.state.beat=game.beats().length;game.renderBeat();if(game.inChoice&&matches(choice.when,game.state))game.choose(choice);}game.toast('已恢复这个节点的状态，后续会按新选择推进。');};
 const select=id=>{selected=id;world.querySelectorAll('.flow-node').forEach(n=>n.classList.toggle('selected',n.dataset.id===id));game.effects.animate(detail,[{opacity:.4,transform:"translateY(4px)"},{opacity:1,transform:"translateY(0)"}],{duration:220});detail.replaceChildren();const s=game.story.scenes[id],seen=known.has(id),variants=game.saves.data.points?.[id]||[];detail.append(el('span',seen?s.time:'未探索','eyebrow'),el('h3',seen?s.title:'尚未抵达的节点'));if(!seen){detail.append(el('p','先在故事中走到这里。地图不会提前透露人物行动或结局。'));return;}detail.append(el('p',s.location));if(!variants.length){detail.append(el('p','该节点尚未建立回溯存档，继续故事后会自动记录。'));return;}let point=variants.at(-1);const select=el('select');select.setAttribute('aria-label','选择该节点的路线状态');variants.forEach((v,i)=>{const option=el('option',`路线记录 ${i+1} · ${v.state.evidence.length} 份证据`);option.value=i;select.append(option);});select.value=variants.length-1;detail.append(select);const options=el('div',undefined,'flow-options');const paint=()=>{options.replaceChildren();const state=point.state;if(s.choices?.length){options.append(el('h4','在这里作出的选择'));for(const c of s.choices){const available=matches(c.when,state);if(!available&&!c.showLocked)continue;const taken=saved?.choices.some(x=>x.scene===id&&x.id===c.id);const b=button((taken?'● ':'○ ')+c.text,()=>replay(point,c),'flow-option'+(taken?' taken':''));b.disabled=!available;if(!available)b.append(el('small',c.lockedText||'此路线记录尚未满足条件'));options.append(b);}}else options.append(button('重看这个场景',()=>replay(point),'primary'));options.append(el('p',`恢复时：${state.evidence.length} 份证据 · ${state.echoes.length} 个回响。不会套用当前终章的状态。`,'flow-note'));};select.onchange=()=>{point=variants[Number(select.value)];paint();};paint();detail.append(options);};
 for(const id of chapter.scenes){const s=game.story.scenes[id],seen=known.has(id),pos=layout.positions[id];const b=button('',()=>select(id),'flow-node'+(!seen?' unknown':'')+(s.ending&&seen?' terminal '+game.story.endings[s.ending].kind:''));b.dataset.id=id;b.style.left=pos.x+'px';b.style.top=pos.y+'px';if(seen){const img=el('img');img.src=game.art.backgrounds[s.bg];img.alt='';b.append(img);}else b.append(el('div','?','flow-placeholder'));b.append(el('span',seen?s.title:'未探索'),el('small',seen?(s.ending?game.story.endings[s.ending].label:s.choices?'选择节点':'剧情场景'):'未知分支'));b.setAttribute('aria-label',seen?'查看节点：'+s.title:'未探索节点');world.append(b);}
 const resize=()=>{world.style.transform=`scale(${zoom})`;sizer.style.width=layout.width*zoom+'px';sizer.style.height=layout.height*zoom+'px';};
 toolbar.append(button('−',()=>{zoom=Math.max(.4,zoom-.1);resize();},'flow-zoom'),button('+',()=>{zoom=Math.min(1.5,zoom+.1);resize();},'flow-zoom'),button('当前节点',()=>{const id=chapter.scenes.includes(saved?.scene)?saved.scene:chapter.entry;select(id);const p=layout.positions[id];scroll.scrollTo({left:p.x*zoom-scroll.clientWidth/2+85,top:p.y*zoom-scroll.clientHeight/2+55,behavior:game.effects.reduced()?'instant':'smooth'});}));
 sizer.append(world);scroll.append(sizer);shell.append(scroll,detail);body.append(tabs,toolbar,shell);resize();const currentId=chapter.scenes.includes(saved?.scene)?saved.scene:chapter.entry;select(currentId);requestAnimationFrame(()=>{const p=layout.positions[currentId];scroll.scrollLeft=Math.max(0,p.x*zoom-scroll.clientWidth/2+85);scroll.scrollTop=Math.max(0,p.y*zoom-scroll.clientHeight/2+55);});
 let drag=null;
 scroll.onpointerdown=e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('.flow-node'))return;drag={x:e.clientX,y:e.clientY,left:scroll.scrollLeft,top:scroll.scrollTop};scroll.setPointerCapture(e.pointerId);scroll.style.cursor='grabbing';};
 scroll.onpointermove=e=>{if(drag){scroll.scrollLeft=drag.left+drag.x-e.clientX;scroll.scrollTop=drag.top+drag.y-e.clientY;}};
 scroll.onpointerup=scroll.onpointercancel=()=>{drag=null;scroll.style.cursor='';};
}
