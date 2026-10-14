export const VERSION = 2;
export const clone = v => structuredClone(v);
export function newState(story) {
  return {version: VERSION, scene: story.chapters[0].entry, beat: 0, chapter: 'c1', values: {trust: 0,zhou: 0,self: 0}, flags: {}, evidence: [], echoes: [], history: [], checkpoints: {}, path: [], choices: [], ending: null, startedAt: Date.now(), lastSaved: Date.now()};
}
export function matches(rule, state) {
  if (!rule) return true;
  if (rule.all) return rule.all.every(r => matches(r,state));
  if (rule.any) return rule.any.some(r => matches(r,state));
  if (rule.not) return !matches(rule.not,state);
  if (rule.flag) return state.flags[rule.flag] === (rule.value ?? true);
  if (rule.evidence) return state.evidence.includes(rule.evidence);
  if (rule.minEvidence !== undefined) return state.evidence.length >= rule.minEvidence;
  if (rule.stat) return (state.values[rule.stat] || 0) >= rule.min;
  return false;
}
export function visibleBeats(scene,state) {return scene.beats.filter(b => matches(b.when,state));}
export function visibleChoices(scene,state) {return (scene.choices || []).filter(c => matches(c.when,state));}
export function resolveNext(target,state) {
  if (typeof target === 'string') return target;
  if (Array.isArray(target)) return target.find(t => matches(t.when,state))?.to;
  return null;
}
export function applyChoice(state,choice) {
  const next=clone(state);
  for (const [key,value] of Object.entries(choice.changes || {})) next.values[key]=(next.values[key]||0)+value;
  Object.assign(next.flags,choice.flags || {});
  next.evidence=[...new Set([...next.evidence,...(choice.evidence||[])])];
  if(choice.discardEvidence) next.evidence=next.evidence.filter(id=>!choice.discardEvidence.includes(id));
  if (choice.echo && !next.echoes.includes(choice.echo)) next.echoes.push(choice.echo);
  next.choices.push({scene:state.scene,id:choice.id,text:choice.text});
  next.scene=resolveNext(choice.next,next);
  next.beat=0;
  next.lastSaved=Date.now();
  return next;
}
export function enterScene(state,scene,chapter) {
  if(!scene) throw new Error('场景不存在：'+state.scene);
  state.chapter=chapter.id;
  if(!state.checkpoints[chapter.id]) state.checkpoints[chapter.id]=snapshot(state);
  if(scene.grant) state.evidence=[...new Set([...state.evidence,...scene.grant])];
  if(scene.setFlags) Object.assign(state.flags,scene.setFlags);
  state.path=state.path||[];
  if(state.path.at(-1)!==scene.id)state.path.push(scene.id);
}
export function snapshot(state) {
  const out=clone(state);out.checkpoints={};out.history=[];return out;
}
const safeKey=k=>typeof k==='string' && /^[a-zA-Z0-9_-]{1,80}$/.test(k) && !['__proto__','constructor','prototype'].includes(k);
export function validateSave(input,story) {
  if(!input || input.version!==VERSION || !Object.hasOwn(story.scenes,input.scene)) throw new Error('存档版本或场景不兼容');
  if(!Number.isInteger(input.beat)||input.beat<0||input.beat>500) throw new Error('阅读进度无效');
  if(!input.values||!['trust','zhou','self'].every(k=>Number.isFinite(input.values[k])&&Math.abs(input.values[k])<1000)) throw new Error('数值无效');
  if(!input.flags||Array.isArray(input.flags)||typeof input.flags!=='object'||!Object.keys(input.flags).every(safeKey)) throw new Error('状态无效');
  if(!Array.isArray(input.evidence)||!input.evidence.every(k=>Object.hasOwn(story.evidence,k))) throw new Error('证据无效');
  if(!Array.isArray(input.echoes)||!input.echoes.every(k=>Object.hasOwn(story.echoes,k))) throw new Error('回响无效');
  if(!Array.isArray(input.history)||input.history.length>2000||!input.history.every(x=>typeof x.text==='string'&&x.text.length<10000&&typeof x.speaker==='string')) throw new Error('日志无效');
  if(!Array.isArray(input.choices)||input.choices.length>500) throw new Error('选择记录无效');
  if(input.path&&(!Array.isArray(input.path)||input.path.length>200||!input.path.every(id=>Object.hasOwn(story.scenes,id))))throw new Error('路线记录无效');
  if(!input.checkpoints||typeof input.checkpoints!=='object'||Array.isArray(input.checkpoints)) throw new Error('章节记录无效');
  const clean=clone(input);
  clean.flags=Object.fromEntries(Object.entries(clean.flags).filter(([k,v])=>safeKey(k)&&['boolean','string','number'].includes(typeof v)));
  for(const [id,cp] of Object.entries(clean.checkpoints)) {
    if(!story.chapters.some(c=>c.id===id)) throw new Error('章节无效');
    validateSave({...cp,checkpoints:{}},story);
  }
  if(clean.ending&&!Object.hasOwn(story.endings,clean.ending)) throw new Error('结局无效');
  return clean;
}
export function chapterFor(story,sceneId) {return story.chapters.find(c=>c.scenes.includes(sceneId));}
