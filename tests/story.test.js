import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newState,chapterFor,enterScene,visibleBeats,visibleChoices,applyChoice,resolveNext,validateSave,matches} from '../src/engine.js';
import {Saves,KEY} from '../src/storage.js';
import {graphLayout} from '../src/flow.js';
const story=JSON.parse(fs.readFileSync(new URL('../src/story.json',import.meta.url),'utf8'));
const refs=t=>typeof t==='string'?[t]:Array.isArray(t)?t.map(x=>x.to):[];
const projection=new Map();
function dependencies(id){if(projection.has(id))return projection.get(id);const s=story.scenes[id],result={flags:new Set(),stats:new Set(),evidence:new Set()};function rule(r){if(!r)return;if(r.all||r.any)(r.all||r.any).forEach(rule);else if(r.not)rule(r.not);else if(r.flag)result.flags.add(r.flag);else if(r.stat)result.stats.add(r.stat);else if(r.evidence)result.evidence.add(r.evidence);}function target(t){if(Array.isArray(t))t.forEach(x=>rule(x.when));}s.beats.forEach(b=>rule(b.when));target(s.next);for(const c of s.choices||[]){rule(c.when);target(c.next);}for(const next of [...refs(s.next),...(s.choices||[]).flatMap(c=>refs(c.next))]){const child=dependencies(next);for(const group of ['flags','stats','evidence'])for(const k of child[group])result[group].add(k);}projection.set(id,result);return result;}

test('Every combination of authored choices reaches a real ending without dead ends',()=>{
 const endings=new Set(),scenes=new Set(),choices=new Set(),states=new Set();let routes=0;
 function walk(state,depth=0){assert.ok(depth<110,'cycle');const scene=story.scenes[state.scene];assert.ok(scene,'scene exists');enterScene(state,scene,chapterFor(story,state.scene));scenes.add(scene.id);const dep=dependencies(scene.id),key=JSON.stringify([state.scene,[...dep.stats].map(k=>state.values[k]),[...dep.flags].map(k=>state.flags[k]),[...dep.evidence].map(k=>state.evidence.includes(k))]);if(states.has(key))return;states.add(key);assert.ok(visibleBeats(scene,state).length);state.checkpoints={};state.choices=[];state.path=[];if(scene.ending){endings.add(scene.ending);routes++;return;}const available=visibleChoices(scene,state);if(available.length){for(const c of available){choices.add(scene.id+':'+c.id);walk(applyChoice(state,c),depth+1);}}else{const next=resolveNext(scene.next,state);assert.ok(next);walk({...structuredClone(state),scene:next,beat:0},depth+1);}}
 walk(newState(story));assert.equal(scenes.size,Object.keys(story.scenes).length);assert.equal(choices.size,Object.values(story.scenes).reduce((n,s)=>n+(s.choices?.length||0),0));assert.deepEqual([...endings].sort(),Object.keys(story.endings).sort());assert.ok(states.size>=100);console.log('Distinct causal states checked:',states.size,'endings:',endings.size);
});
test('Decisions alter relationships, later dialogue and exported echoes',()=>{
 let state=newState(story);state.scene='c1_06';const keep=story.scenes.c1_06.choices[0];state=applyChoice(state,keep);assert.ok(state.evidence.includes('copy'));assert.ok(state.echoes.includes('mira'));assert.equal(state.values.trust,2);state.scene='c3_04';state=applyChoice(state,story.scenes.c3_04.choices[0]);assert.equal(resolveNext(story.scenes.c3_contact.next,state),'c3_truth_link');state.flags.calledTang=false;assert.equal(resolveNext(story.scenes.c3_contact.next,state),'c3_contact_choice');
});
test('A chapter checkpoint preserves incoming choices and can be loaded',()=>{
 const state=newState(story);state.flags.calledTang=true;state.values.trust=3;state.evidence=['memory'];state.scene='c4_01';enterScene(state,story.scenes[state.scene],story.chapters[3]);const cp=state.checkpoints.c4;assert.equal(cp.flags.calledTang,true);assert.equal(cp.values.trust,3);assert.deepEqual(validateSave(cp,story).evidence,['memory']);assert.equal(cp.scene,'c4_01');
});
test('Invalid and hostile save data is rejected before replacing an existing save',()=>{
 const valid=newState(story);assert.throws(()=>validateSave({...valid,scene:'missing'},story));assert.throws(()=>validateSave({...valid,evidence:['unreleased']},story));assert.throws(()=>validateSave({...valid,values:{trust:NaN,zhou:0,self:0}},story));assert.throws(()=>validateSave({...valid,flags:JSON.parse('{"__proto__":true}')},story));
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};const saves=new Saves(story);saves.save(valid);const old=saves.export();assert.throws(()=>saves.import(JSON.stringify({game:'canxiang-vn',format:1,auto:{...valid,scene:'bad'}})));assert.equal(saves.export(),old);assert.ok(storage.has(KEY));
});
test('New storage leaves legacy keys intact and supports full roundtrip',()=>{
 const storage=new Map([['echo-protocol:v3:archive','OLD'],['cx_save','OLDER']]);globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};const s=new Saves(story),state=newState(story);state.flags.rescued=true;state.evidence=['stop'];s.save(state,2);s.save(state);const next=new Saves(story);next.import(s.export());assert.equal(next.data.slots[2].flags.rescued,true);assert.equal(storage.get('echo-protocol:v3:archive'),'OLD');assert.equal(storage.get('cx_save'),'OLDER');
});
test('Unavailable browser storage keeps play and export available',()=>{
 globalThis.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};const s=new Saves(story);s.save(newState(story));assert.ok(s.memory);assert.ok(JSON.parse(s.export()).auto);assert.ok(matches({not:{flag:'missing'}},newState(story)));
});

function play(overrides={}){let s=newState(story);for(let n=0;n<110;n++){const scene=story.scenes[s.scene];enterScene(s,scene,chapterFor(story,s.scene));if(scene.ending)return {ending:scene.ending,state:s};const choices=visibleChoices(scene,s);if(choices.length){const selected=overrides[scene.id]?choices.find(c=>c.id===overrides[scene.id]):choices[0];assert.ok(selected,'choice unavailable: '+scene.id+' '+overrides[scene.id]);s=applyChoice(s,selected);}else{s.scene=resolveNext(scene.next,s);s.beat=0;}}throw Error('did not finish');}
test('The same final action produces distinct endings after different early decisions',()=>{
 assert.equal(play().ending,'dawn');
 assert.equal(play({'c1_06':'index'}).ending,'farshore');
 assert.equal(play({'fin_04':'send'}).ending,'dawn');
 assert.equal(play({'c3_link_memory':'evidence','fin_04':'send'}).ending,'witness');
 assert.equal(play({'c4_mira_plan':'container','fin_04':'send'}).ending,'lastlight');
 assert.equal(play({'c3_witness':'avoid'}).ending,'farshore');
});
test('Bad endings have different causes, including an early fatal branch',()=>{
 assert.equal(play({'c4_03':'force'}).ending,'zero');
 assert.equal(play({'fin_04':'reset'}).ending,'zero');
 assert.equal(play({'c2_02':'deal','c4_deal_review':'uphold','fin_04':'internal'}).ending,'shelter');
 assert.equal(play({'c3_04':'wait','c3_contact_choice':'alone','fin_04':'send'}).ending,'zero');
 assert.equal(play({'c3_04':'wait','c3_contact_choice':'pretend','c4_exposed':'continue_lie','fin_04':'send'}).ending,'zero');
});
test('Lost originals and absent witnesses are not automatically restored',()=>{
 const weak=play({'c1_06':'index','c2_04':'question','c3_witness':'avoid','fin_04':'send'});
 assert.ok(!weak.state.evidence.includes('copy'));assert.ok(!weak.state.evidence.includes('voice'));assert.ok(!weak.state.flags.linConsent);assert.ok(!matches(story.scenes.fin_04.choices.find(c=>c.id==='joint').when,weak.state));
});
test('Flow snapshots preserve the actual earlier route without leaking later choices',()=>{
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const saves=new Saves(story);let state=newState(story);state.scene='c1_06';state.flags.independent=false;enterScene(state,story.scenes[state.scene],story.chapters[0]);saves.capture(state);saves.save(state);
 state=applyChoice(state,story.scenes.c1_06.choices[0]);state.flags.independent=true;state.evidence.push('export');
 const restored=structuredClone(saves.data.points.c1_06[0].state);assert.ok(!restored.evidence.includes('copy'));assert.ok(!restored.evidence.includes('export'));assert.equal(restored.flags.independent,false);
 const changed=applyChoice(restored,story.scenes.c1_06.choices[1]);assert.ok(!changed.evidence.includes('copy'));assert.equal(changed.scene,'c1_index');assert.equal(changed.choices.length,1);
 const fresh=new Saves(story);fresh.import(saves.export());assert.equal(fresh.data.points.c1_06[0].state.scene,'c1_06');
});
test('All chapter maps are acyclic and position every actual node',()=>{for(const c of story.chapters){const layout=graphLayout(story,c);assert.equal(Object.keys(layout.positions).length,c.scenes.length);for(const e of layout.edges)assert.ok(layout.positions[e.from].x<layout.positions[e.to].x);}});
