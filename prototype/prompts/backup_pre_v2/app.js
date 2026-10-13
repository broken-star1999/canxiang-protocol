const D=window.STORY,E=window.Engine,$=s=>document.querySelector(s);
const SCN=Object.fromEntries(D.scenes.map(s=>[s.id,s]));
const IMG=D.images||{};const path=id=>IMG[id];
let st=E.initState(D),opt={showKey:false};
try{opt=Object.assign(opt,JSON.parse(localStorage.getItem("cx_opt")||"{}"))}catch(e){}
function setImg(el,id,label){el.style.backgroundImage="";el.textContent=id?label||id:"";if(!id||!path(id))return;const i=new Image();i.onload=()=>{el.style.backgroundImage=`url(${i.src})`;el.textContent=""};i.src=path(id)}
function render(){const s=SCN[st.scene];$("#clock").textContent=E.hm(D.clock_start||"00:00",st.mins);renderSide();
 if(!s)return finish();$("#sid").textContent=s.id;setImg($("#bg"),s.bg,"［"+s.bg+"］");const p=$("#portrait");p.className=s.portrait?"":"none";p.style.display=s.portrait?"":"none";setImg(p,s.portrait,"MIRA");
 $("#text").textContent=s.text;const box=$("#choices");box.innerHTML="";
 for(const c of s.choices||[]){const b=document.createElement("button");b.className="card"+(c.key&&opt.showKey?" key":"");
  b.innerHTML=`<div class="thumb"></div><div><div>${c.label}</div><div class="t">+${c.time||0} 分钟</div></div>`;setImg(b.querySelector(".thumb"),"thumb:"+c.id,"缩略图");
  b.onclick=()=>choose(c);box.appendChild(b)}
 if(!(s.choices||[]).length)finish()}
function choose(c){E.apply(st,c,D);renderSide();$("#clock").textContent=E.hm(D.clock_start,st.mins);
 $("#text").innerHTML="";const r=document.createElement("div");r.className="result";r.textContent=c.result||"";$("#text").appendChild(r);
 const box=$("#choices");box.innerHTML="";const b=document.createElement("button");b.textContent="继续 ▸";b.onclick=render;box.appendChild(b);scrollTo(0,0)}
function finish(){const e=SCN[st.scene]?E.ending(D,st):null;$("#sid").textContent=e?e.id:"END";$("#portrait").style.display="none";
 const bg=$("#bg");if(e)setImg(bg,"ending:"+e.shown,"［ending_"+e.shown+"］");else{bg.style.backgroundImage="";bg.textContent=""}
 const ver=e&&e.high!==null?(e.high?"（高信任版）":"（低信任版）"):"";
 const rev=e?(e.review||"〔复盘文案待编剧补写："+e.shown+ver+"〕"):"（第一章后续未写；next → "+st.scene+"）";
 $("#text").innerHTML=`<h2>${e?"结局 "+e.id+ver:"本段结束"}</h2>${e&&e.selves.length?`<p class="t">自我结局：${e.selves.join(" / ")}</p>`:""}<p>${rev}</p><h3>你做过的关键抉择</h3><ul>${st.keys.map(k=>"<li>◆ "+k+"</li>").join("")||"<li>（无）</li>"}</ul><p class="t">用时 ${st.mins} 分钟 · 终点 ${E.hm(D.clock_start,st.mins)}</p>`;
 $("#choices").innerHTML='<button onclick="restart()">重新开始</button>'}
function renderSide(){$("#logList").innerHTML=st.log.map(l=>`<li>${E.hm(D.clock_start,l.at)} ${l.text}${l.key?' <span class="kmark">◆关键</span>':""}</li>`).join("");
 $("#statPre").textContent=JSON.stringify({...st.vals,flags:st.flags,分钟:st.mins},null,1)}
function restart(){st=E.initState(D);render()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{const p=$("#"+b.dataset.p),h=p.classList.contains("hidden");document.querySelectorAll(".panel").forEach(x=>x.classList.add("hidden"));if(h)p.classList.remove("hidden")});
$("#save").onclick=()=>{localStorage.setItem("cx_save",JSON.stringify(st));$("#msg").textContent="已存档"};
$("#load").onclick=()=>{const s=localStorage.getItem("cx_save");if(s){st=JSON.parse(s);st.bonuses=st.bonuses||[];render();$("#msg").textContent="已读档"}else $("#msg").textContent="没有存档"};
$("#restart").onclick=()=>{restart();$("#msg").textContent="已重开"};
$("#optKey").checked=opt.showKey;$("#optKey").onchange=e=>{opt.showKey=e.target.checked;localStorage.setItem("cx_opt",JSON.stringify(opt));render()};
render();
