// 纯逻辑：浏览器与 node 测试共用
(function(G){
const clone=o=>JSON.parse(JSON.stringify(o));
function initState(D){return{scene:D.scenes[0].id,vals:Object.assign({},D.values),flags:[],mins:0,log:[],keys:[],bonuses:[]}}
function hm(start,m){const[h,mm]=(start||"00:00").split(":").map(Number);const t=h*60+mm+m;return String(Math.floor(t/60)%24).padStart(2,"0")+":"+String(t%60).padStart(2,"0")}
function evalWhen(expr,st){if(expr===undefined||expr===null)return true;
 const js=String(expr).replace(/flag:([\w]+)/g,(_,f)=>"F("+JSON.stringify(f)+")").replace(/\b([A-Z]{2,})\b/g,(_,v)=>"V("+JSON.stringify(v)+")");
 try{return!!Function("V","F","return("+js+")")(v=>st.vals[v]||0,f=>st.flags.includes(f))}catch(e){return false}}
function eff(st,e){for(const[k,v]of Object.entries(e||{}))st.vals[k]=(st.vals[k]||0)+Number(v)}
function checkBonuses(D,st){for(const b of D.bonuses||[]){if(b.once!==false&&st.bonuses.includes(b.id))continue;
 if(evalWhen(b.when,st)){eff(st,b.effects);st.bonuses.push(b.id);st.log.push({text:"［联动］"+(b.log||b.id),at:st.mins,bonus:true})}}}
function apply(st,c,D){eff(st,c.effects);for(const f of c.flags_set||[])if(!st.flags.includes(f))st.flags.push(f);st.mins+=Number(c.time||0);
 st.log.push({text:String(c.log||c.label).replace(/^\d\d:\d\d\s*/,""),at:st.mins,key:!!c.key});if(c.key)st.keys.push(c.label);st.scene=c.next;if(D)checkBonuses(D,st)}
const blank=t=>!t||/^[\s…\.。]*$/.test(String(t));
// 返回 {id,label,review,high,image,selves[]}
function ending(D,st){const E=D.endings||[];if(!E.length)return null;const byId=Object.fromEntries(E.map(e=>[e.id,e]));
 let hit=E.find(e=>evalWhen(e.when,st));if(!hit)return null;const base=hit.same_as&&byId[hit.same_as]||hit;
 let high=null,review=base.review;if(base.variant!==undefined){high=evalWhen(base.variant,st);
  review=(high?base.review_high:base.review_low)??base.review}
 return{id:hit.id,shown:base.id,review:blank(review)?null:review,high,selves:(D.self_endings||[]).filter(s=>evalWhen(s.when,st)).map(s=>s.id)}}
G.Engine={initState,hm,apply,evalWhen,ending,checkBonuses,clone,blank}})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined")module.exports=globalThis.Engine;
