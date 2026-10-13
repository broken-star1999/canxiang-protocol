// node test_paths.js → 遍历所有分支并输出报告（同时写 test-report.txt）
const fs=require("fs"),path=require("path"),E=require("./engine.js");
const D=JSON.parse(fs.readFileSync(path.join(__dirname,"data.json"),"utf8"));
const SCN=Object.fromEntries(D.scenes.map(s=>[s.id,s]));const out=[];const P=s=>out.push(s);let fail=0;
const ends=[],dead=new Set(),refd=new Set([D.scenes[0].id]);
function walk(st,trail,depth){const s=SCN[st.scene];const term=!s||!(s.choices||[]).length;
 if(term){const e=s?E.ending(D,st):null;ends.push({st,trail,e,unfinished:!s});if(!s||!e)dead.add(!s?`${trail.at(-1)} → next "${st.scene}"（场景不存在）`:`${s.id} 无选项且无结局`);return}
 if(depth>300)return;for(const c of s.choices){refd.add(c.next);const n=E.clone(st);E.apply(n,c,D);walk(n,[...trail,c.id],depth+1)}}
walk(E.initState(D),[],0);
P(`数据源: ${D._sources.join(", ")}`);
P(`场景 ${D.scenes.length} · 路径 ${ends.length} · endings ${D.endings.length} · bonuses ${D.bonuses.length} · self_endings ${D.self_endings.length}`);
// 重复 id
const dup=a=>a.filter((x,i)=>a.indexOf(x)!==i);const d1=dup(D.scenes.map(s=>s.id)),d2=dup(D.scenes.flatMap(s=>(s.choices||[]).map(c=>c.id)));
if(d1.length||d2.length)P(`\n[重复 id] 场景:${d1} 选项:${d2}`);
P(`\n[死路] ${dead.size}`);dead.forEach(x=>P("  - "+x));
P(`\n[未被引用的场景] ${D.scenes.filter(s=>!refd.has(s.id)).map(s=>s.id).join(", ")||"无"}`);
// 图片
const need=new Set();D.scenes.forEach(s=>{s.bg&&need.add(s.bg);s.portrait&&need.add(s.portrait);(s.choices||[]).forEach(c=>need.add("thumb:"+c.id))});
D.endings.filter(e=>!e.same_as).forEach(e=>need.add("ending:"+e.id));
const miss=[...need].filter(k=>!D.images[k]);P(`\n[缺失图片] ${miss.length}/${need.size}（art/out/: <bg>_vN / thumb_<选项id>_vN / ending_<id>_vN .webp）`);P("  "+miss.join(", "));
P(`  已找到: ${Object.entries(D.images).map(([k,v])=>k+"→"+v).join("; ")}`);
// 数值范围
const r={};for(const{st}of ends)for(const[k,v]of Object.entries({...st.vals,分钟:st.mins})){r[k]=r[k]||[1e9,-1e9];r[k][0]=Math.min(r[k][0],v);r[k][1]=Math.max(r[k][1],v)}
P(`\n[路径终点数值范围]`);for(const[k,[a,b]]of Object.entries(r))P(`  ${k}: ${a} ~ ${b}`);P(`  终点时钟: ${E.hm(D.clock_start,r["分钟"][0])} ~ ${E.hm(D.clock_start,r["分钟"][1])}`);
const dist={};ends.forEach(x=>{const k=x.unfinished?"(next 未写，停在本段结束)":x.e?x.e.id:"(无结局)";dist[k]=(dist[k]||0)+1});P(`\n[当前路径结局分布] ${JSON.stringify(dist)}`);
// flag 校验
const setF=new Set(D.scenes.flatMap(s=>(s.choices||[]).flatMap(c=>c.flags_set||[])));
const refF=new Map();const scan=(src,w)=>{for(const m of String(w||"").matchAll(/flag:(\w+)/g)){if(!refF.has(m[1]))refF.set(m[1],new Set());refF.get(m[1]).add(src)}};
D.endings.forEach(e=>{scan(e.id,e.when);scan(e.id+".variant",e.variant)});D.bonuses.forEach(b=>scan(b.id,b.when));D.self_endings.forEach(s=>scan(s.id,s.when));
const unset=[...refF].filter(([f])=>!setF.has(f));
P(`\n[条件引用但数据中无人设置的 flag] ${unset.length}/${refF.size}`);unset.forEach(([f,s])=>P(`  - ${f}  ← ${[...s].join(",")}`));
// 可达性：静态（假设所有 flag 均可设置、数值任意）找遮蔽；动态（实际数据）
const allF=[...refF.keys()];
function sample(){const out=[];const ev=[0,30,50,60,65,70,85,100];const sv=[0,34,35,64,65,100];
 for(let i=0;i<20000;i++){const st={vals:{EVD:ev[i%8],TRU:ev[(i>>3)%8],EXP:ev[(i>>6)%8],SLF:sv[(i>>9)%6]},flags:allF.filter(()=>Math.random()<.3)};out.push(st)}return out}
const S=sample(),staticHit={};for(const st of S){const e=E.ending(D,st);if(e)staticHit[e.id]=1}
const dynHit=new Set(ends.filter(x=>x.e).map(x=>x.e.id));
P(`\n[结局可达性]`);for(const e of D.endings){const deps=[...String(e.when).matchAll(/flag:(\w+)/g)].map(m=>m[1]).filter(f=>!setF.has(f));
 P(`  - ${e.id}: 理论${staticHit[e.id]?"可达":"不可达（被前序条件完全遮蔽）"} · 当前数据${dynHit.has(e.id)?"已走到":"未走到"}${deps.length?" · 依赖未设置 flag: "+[...new Set(deps)].join(","):""}`)}
// 引擎自检
const T={vals:{TRU:3,EVD:0},flags:["x"]};const ok1=E.evalWhen("TRU >= 3 && flag:x",T)&&!E.evalWhen("TRU >= 4",T)&&E.evalWhen("!flag:y",T)&&E.evalWhen("true",T);
const bd={bonuses:[{id:"b",when:"flag:a && flag:b",effects:{EVD:10},once:true}]};const bs={vals:{EVD:0},flags:["a","b"],log:[],bonuses:[],mins:0};E.checkBonuses(bd,bs);E.checkBonuses(bd,bs);
const ok2=bs.vals.EVD===10&&bs.log.length===1;
const vD={endings:[{id:"X",when:"true",variant:"TRU >= 60",review:"……"}],self_endings:[{id:"S",when:"SLF<35"}]};const ve=E.ending(vD,{vals:{TRU:70,SLF:0},flags:[]});
const ok3=ve.high===true&&ve.review===null&&ve.selves[0]==="S";
const fb=E.ending({endings:[{id:"A",when:"false",review:"a"},{id:"F",when:"true",same_as:"A"}]},{vals:{},flags:[]});const ok4=fb.id==="F"&&fb.shown==="A";
P(`\n[引擎自检] 表达式${ok1?"✓":"✗"} bonus-once${ok2?"✓":"✗"} variant/占位/自我结局${ok3?"✓":"✗"} 兜底same_as${ok4?"✓":"✗"}`);if(!(ok1&&ok2&&ok3&&ok4))fail=1;
// 真结局三路线
const ROUTES={"甲 现场派":["c1_s01a_mira","c1_s01b_chat"],"乙 日志派":["c1_s00a_answer","c1_s01a_mira"],"丙 人心派":["c1_s00a_answer","c1_s01a_mira","c1_s01b_chat"]};
const need3=["bus_log","zhou_heard","zhou_letter","cause_K1","send_EXT"];const ready=need3.every(f=>setF.has(f)||JSON.stringify(D.scenes).includes(f));
P(`\n[真结局用例 E_ECHO_TRUE] ${ready?"启用":"待启用：剧情数据尚未包含 "+need3.filter(f=>!setF.has(f)).join("/")+" 等节点"}`);
for(const[n,pre]of Object.entries(ROUTES)){if(!ready){P(`  - ${n}: SKIP（开场前缀 ${pre.join(",")}）`);continue}
 const hit=ends.find(x=>pre.every(p=>x.trail.includes(p))&&x.e&&x.e.id==="E_ECHO_TRUE");P(`  - ${n}: ${hit?"PASS":"FAIL"}`);if(!hit)fail=1}
const preview=ends.map(x=>E.ending(D,x.st)).filter(Boolean);const pd={};preview.forEach(e=>pd[e.id+"+"+e.selves.join("+")]=(pd[e.id+"+"+e.selves.join("+")]||0)+1);P(`[假如此刻进入终局判定] ${JSON.stringify(pd)}`);
P(`\n[路径明细（前 30）]`);ends.slice(0,30).forEach(({st,trail,e})=>P(`  ${trail.join(" > ")} | ${JSON.stringify(st.vals)} ${st.mins}min | ${e?e.id+(e.selves.length?"+"+e.selves.join("+"):""):"本段结束(next 未写)"}`));
const txt=out.join("\n");console.log(txt);fs.writeFileSync(path.join(__dirname,"test-report.txt"),txt+"\n");process.exitCode=fail;
