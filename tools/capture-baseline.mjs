// Run only against the unmodified baseline, before changing story or save code.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { newState, enterScene, chapterFor, visibleBeats, visibleChoices, applyChoice, resolveNext } from '../src/engine.js';
import { Saves } from '../src/storage.js';

const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root));
const story = JSON.parse(read('src/story.json'));
const art = JSON.parse(read('assets/manifest.json'));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
if (commit !== '07c0697a9ed1c0bab51fc17caee5464c93d3ddfe') throw Error('Baseline must be captured from 07c0697');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const assets = [...new Set([...Object.values(art.backgrounds), ...Object.values(art.characters).flatMap(Object.values), ...Object.values(art.cgs).map(c => c.image)])];
const manifest = { commit, storySha256: sha(read('src/story.json')), assets: Object.fromEntries(assets.map(p => [p, sha(read(p))])) };
fs.writeFileSync(new URL('docs/refactor/baseline.json', root), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(new URL('tests/fixtures/story-before-refactor.json.gz', root), gzipSync(read('src/story.json')));
const routes = [ {}, { c1_06: 'index' }, { fin_04: 'joint' }, { c3_link_memory: 'evidence', fin_04: 'send' }, { c4_mira_plan: 'container', fin_04: 'send' }, { c2_02: 'deal', c4_deal_review: 'uphold', fin_04: 'internal' }, { fin_04: 'reset' }, { c4_03: 'force' }, { c3_04: 'wait', c3_contact_choice: 'alone', fin_04: 'send' }, { c2_02: 'press', c2_04: 'question', c4_03: 'record' }, { c3_04: 'wait', c3_contact_choice: 'pretend', c4_exposed: 'correct', fin_04: 'send' } ];
const fixtures = [];
for (const [route, overrides] of routes.entries()) {
  const memory = new Map();
  globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  const saves = new Saves(story);
  let state = newState(story);
  state.startedAt = state.lastSaved = 1793188800000;
  for (let step = 0; step < 110; step++) {
    const scene = story.scenes[state.scene];
    enterScene(state, scene, chapterFor(story, scene.id));
    saves.capture(state);
    const beats = visibleBeats(scene, state);
    for (const beat of [0, Math.max(0, beats.length - 1), beats.length]) {
      state.beat = beat;
      if (beat < beats.length) {
        const b = beats[beat];
        state.history.push({ scene: scene.id, beat, speaker: b.speaker, text: b.text, time: scene.time });
        saves.data.collection.read.push(scene.id + ':' + scene.beats.indexOf(b));
      }
      if (scene.ending) state.ending = scene.ending;
      saves.save(state);
      saves.save(state, step % 6);
      if (route === 0 || scene.ending || ['c4_refusal','c4_01','c4_exposed'].includes(scene.id)) {
        fixtures.push({ route, scene: scene.id, beat, envelope: JSON.parse(saves.export()) });
      }
    }
    if (scene.ending) break;
    const choices = visibleChoices(scene, state);
    if (choices.length) {
      const choice = overrides[scene.id] ? choices.find(c => c.id === overrides[scene.id]) : choices[0];
      if (!choice) throw Error('Unavailable fixture choice');
      state = applyChoice(state, choice);
    } else { state.scene = resolveNext(scene.next, state); state.beat = 0; }
  }
}
fs.writeFileSync(new URL('tests/fixtures/legacy-v2.json.gz', root), gzipSync(JSON.stringify(fixtures)));
console.log(`Captured ${fixtures.length} legacy saves and ${assets.length} art hashes from ${commit}`);
