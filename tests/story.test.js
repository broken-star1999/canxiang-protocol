import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newState,chapterFor,enterScene,visibleBeats,visibleChoices,applyChoice,resolveNext,validateSave,matches} from '../src/engine.js';
import {Saves,KEY} from '../src/storage.js';
const story=JSON.parse(fs.readFileSync(new URL('../src/story.json',import.meta.url),'utf8'));

test('Every combination of authored choices reaches a real ending without dead ends',()=>{
 const endings=new Set(),scenes=new Set(),choices=new Set();let routes=0;
 function walk(state,depth=0){assert.ok(depth<100,'cycle');const scene=story.scenes[state.scene];assert.ok(scene,'scene exists');enterScene(state,scene,chapterFor(story,state.scene));scenes.add(scene.id);assert.ok(visibleBeats(scene,state).length);if(scene.ending){endings.add(scene.ending);routes++;return;}const available=visibleChoices(scene,state);if(available.length){for(const c of available){choices.add(scene.id+':'+c.id);walk(applyChoice(state,c),depth+1);}}else{const next=resolveNext(scene.next,state);assert.ok(next);walk({...structuredClone(state),scene:next,beat:0},depth+1);}}
 walk(newState(story));assert.equal(scenes.size,Object.keys(story.scenes).length);assert.equal(choices.size,Object.values(story.scenes).reduce((n,s)=>n+(s.choices?.length||0),0));assert.deepEqual([...endings].sort(),Object.keys(story.endings).sort());assert.ok(routes>=100);console.log('Complete routes checked:',routes);
});
test('Decisions alter relationships, later dialogue and exported echoes',()=>{
 let state=newState(story);state.scene='c1_06';const keep=story.scenes.c1_06.choices[0];state=applyChoice(state,keep);assert.ok(state.evidence.includes('copy'));assert.ok(state.echoes.includes('mira'));assert.equal(state.values.trust,2);state.scene='c3_04';state=applyChoice(state,story.scenes.c3_04.choices[0]);assert.ok(visibleBeats(story.scenes.c3_09,state).some(b=>b.text.includes('没有骗我')));assert.ok(!visibleBeats(story.scenes.c3_09,state).some(b=>b.text.includes('下次也可以')));
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
