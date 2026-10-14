import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const story=JSON.parse(fs.readFileSync(path.join(root,'src/story.json'),'utf8'));
const art=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
const errors=[];const check=(ok,msg)=>{if(!ok)errors.push(msg);};
const allScenes=Object.keys(story.scenes);
const targets=target=>typeof target==='string'?[target]:Array.isArray(target)?target.map(x=>x.to):[];
const checkRule=(r,where)=>{if(!r)return;if(r.all||r.any)(r.all||r.any).forEach(x=>checkRule(x,where));else if(r.not)checkRule(r.not,where);else if(r.evidence)check(Object.hasOwn(story.evidence,r.evidence),where+': unknown evidence');else if(r.stat)check(['trust','zhou','self'].includes(r.stat),where+': unknown stat');else check(!!r.flag||r.minEvidence!==undefined,where+': unknown condition');};
for(const c of story.chapters){check(Object.hasOwn(story.scenes,c.entry),'missing chapter entry '+c.id);check(c.scenes.length>0,'empty chapter '+c.id);}
for(const [id,s]of Object.entries(story.scenes)){
 check(Object.hasOwn(art.backgrounds,s.bg),'missing background '+id);
 check(s.beats.length>0,'empty scene '+id);
 check(s.ending||s.next||s.choices?.length,'missing exit '+id);
 check(!s.ending||Object.hasOwn(story.endings,s.ending),'unknown ending '+id);
 const ids=(s.choices||[]).map(c=>c.id);check(ids.length===new Set(ids).size,'duplicate choices '+id);
 for(const to of [...targets(s.next),...(s.choices||[]).flatMap(c=>targets(c.next))])check(allScenes.includes(to),'broken target '+id+' -> '+to);
 for(const c of s.choices||[]){for(const e of c.evidence||[])check(Object.hasOwn(story.evidence,e),'unknown evidence '+id);if(c.echo)check(Object.hasOwn(story.echoes,c.echo),'unknown echo '+id);checkRule(c.when,id);}
 for(const b of s.beats){if(b.background)check(!!art.backgrounds[b.background],'unknown beat background '+id);if(b.cg)check(!!art.cgs?.[b.cg],'unknown CG '+id+' '+b.cg);const character={'MIRA':'mira','周衡':'zhou','林述':'lin','唐棠':'tang'}[b.speaker];if(character){const costume=s.costumes?.[character];const mood=(costume?costume+'-':'')+(b.emotion||'neutral');check(!!art.characters[character]?.[mood],'missing expression '+id+' '+character+' '+mood);}check(typeof b.text==='string'&&b.text.length>0,'empty text '+id);checkRule(b.when,id);}
 for(const e of s.grant||[])check(Object.hasOwn(story.evidence,e),'unknown grant '+id);
 if(s.timer)check(ids.includes(s.timer.fallback),'missing timer fallback '+id);
}
for(const p of [...Object.values(art.backgrounds),...Object.values(art.characters).flatMap(x=>Object.values(x)),...Object.values(art.cgs||{}).map(x=>x.image)])check(fs.existsSync(path.join(root,p)),'missing asset '+p);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Validated ${story.chapters.length} chapters, ${allScenes.length} scenes, ${Object.keys(story.endings).length} endings and all art references.`);
