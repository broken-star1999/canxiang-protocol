import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newState,chapterFor,enterScene,applyChoice,resolveNext,visibleChoices} from '../src/engine.js';
const story=JSON.parse(fs.readFileSync(new URL('../src/story.json',import.meta.url),'utf8'));
const targets=t=>typeof t==='string'?[t]:(t||[]).map(x=>x.to);
test('Every route reaches the live identity reveal before accessing identity evidence or contacting Tang under a new identity',()=>{
 const seen=new Set();
 function walk(id,revealed=false){
  const key=id+':'+revealed;if(seen.has(key))return;seen.add(key);
  const s=story.scenes[id];
  if(id==='c3_witness')revealed=true;
  if((s.grant||[]).some(x=>['medical','memory'].includes(x))||['c3_truth_link','c3_false_link','c3_no_lin','c3_05'].includes(id))assert.ok(revealed,id);
  for(const n of [...targets(s.next),...(s.choices||[]).flatMap(c=>targets(c.next))])walk(n,revealed);
 }
 walk(story.chapters[0].entry);
 assert.ok(seen.has('c3_witness:false'));
 const reveal=story.scenes.c3_witness;
 assert.ok(reveal.beats.some(b=>b.speaker==='林述'));
 assert.ok(reveal.beats.some(b=>b.speaker==='MIRA'&&b.text.includes('记忆装进')));
});
test('Resting Lin still reveals the identity, but never invents her testimony or consent',()=>{
 let state=newState(story),read=[];
 for(let step=0;step<110;step++){
  const s=story.scenes[state.scene];enterScene(state,s,chapterFor(story,s.id));read.push(s.id);
  if(s.id==='c3_contact')break;
  const choices=visibleChoices(s,state);
  if(choices.length){const c=s.id==='c3_witness'?choices.find(c=>c.id==='avoid'):choices[0];state=applyChoice(state,c);}
  else state.scene=resolveNext(s.next,state);
 }
 assert.ok(read.includes('c3_witness'));assert.ok(read.includes('c3_no_lin'));assert.ok(!read.includes('c3_06'));
 assert.ok(state.evidence.includes('medical'));assert.ok(state.evidence.includes('memory'));assert.ok(!state.evidence.includes('voice'));assert.ok(!state.flags.linConsent);
});
test('The early Tang phone call preserves accident honesty without prematurely disclosing the later identity reveal',()=>{
 const s=story.scenes.c3_call;
 assert.ok(s.beats.some(b=>b.text.includes('事故')));
 assert.ok(!s.beats.some(b=>/快照|维护载体|记忆装进|不是你认识/.test(b.text)));
 assert.ok(!/并非|维护|快照/.test(story.echoes.tang.text));
 assert.ok(!story.scenes.c3_medical.grant?.includes('memory'));
});
