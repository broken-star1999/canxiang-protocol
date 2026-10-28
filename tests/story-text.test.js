import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  newState,
  enterScene,
  chapterFor,
  visibleBeats,
  visibleChoices,
  applyChoice,
  resolveNext,
  beatText,
} from "../src/engine.js";
const story = JSON.parse(
  fs.readFileSync(new URL("../src/story.json", import.meta.url), "utf8"),
);
const targets = (t) =>
  typeof t === "string" ? [t] : (t || []).map((row) => row.to);
const cache = new Map();
function dependencies(id) {
  if (cache.has(id)) return cache.get(id);
  const result = { flags: new Set(), stats: new Set(), evidence: new Set() },
    scene = story.scenes[id];
  const rule = (r) => {
    if (!r) return;
    if (r.all || r.any) (r.all || r.any).forEach(rule);
    else if (r.not) rule(r.not);
    else if (r.flag) result.flags.add(r.flag);
    else if (r.stat) result.stats.add(r.stat);
    else if (r.evidence) result.evidence.add(r.evidence);
  };
  const next = (t) => {
    if (Array.isArray(t)) t.forEach((row) => rule(row.when));
  };
  for (const beat of scene.beats) {
    rule(beat.when);
    for (const variant of beat.variants || []) rule(variant.when);
  }
  next(scene.next);
  for (const choice of scene.choices || []) {
    rule(choice.when);
    next(choice.next);
  }
  for (const child of [
    ...targets(scene.next),
    ...(scene.choices || []).flatMap((c) => targets(c.next)),
  ]) {
    const dep = dependencies(child);
    for (const key of Object.keys(result))
      for (const value of dep[key]) result[key].add(value);
  }
  cache.set(id, result);
  return result;
}

test("Dialogue never invents a Tang call or a threat across every distinct causal state", () => {
  const seen = new Set(),
    checked = new Set();
  let count = 0;
  function walk(state) {
    const scene = story.scenes[state.scene];
    enterScene(state, scene, chapterFor(story, scene.id));
    const dep = dependencies(scene.id),
      key = JSON.stringify([
        scene.id,
        ...Object.entries(dep).map(([group, keys]) =>
          [...keys].map((k) =>
            group === "flags"
              ? state.flags[k]
              : group === "stats"
                ? state.values[k]
                : state.evidence.includes(k),
          ),
        ),
      ]);
    if (seen.has(key)) return;
    seen.add(key);
    count++;
    const text = visibleBeats(scene, state)
      .map((b) => beatText(b, state))
      .join("\n");
    if (scene.id === "c4_refusal") {
      if (state.flags.threatened) assert.match(text, /名单/);
      else assert.doesNotMatch(text, /筹码|名单逼|威胁/);
      checked.add("refusal:" + !!state.flags.threatened);
    }
    if (scene.id === "c4_01" && !state.flags.outsideReady) {
      assert.doesNotMatch(text, /唐棠说|从现在开始认识你/);
      checked.add("no-call-memory");
    }
    if (scene.id === "c4_contact_review" && !state.flags.outsideReady) {
      assert.match(text, /没有联系唐棠/);
      assert.doesNotMatch(text, /唐棠发来|你打开通话记录/);
      checked.add("no-call-credentials");
    }
    state.checkpoints = {};
    state.choices = [];
    state.path = [];
    if (scene.ending) return;
    const choices = visibleChoices(scene, state);
    if (choices.length)
      for (const choice of choices) walk(applyChoice(state, choice));
    else
      walk({
        ...structuredClone(state),
        scene: resolveNext(scene.next, state),
        beat: 0,
      });
  }
  walk(newState(story));
  assert.ok(count >= 97333);
  assert.deepEqual([...checked].sort(), [
    "no-call-credentials",
    "no-call-memory",
    "refusal:false",
    "refusal:true",
  ]);
  console.log("Narrative causal states checked:", count);
});

test("Text variants preserve beat identity and first matching variant wins", () => {
  const state = newState(story),
    beat = {
      text: "default",
      variants: [
        { when: { flag: "one" }, text: "first" },
        { when: { flag: "two" }, text: "second" },
      ],
    };
  assert.equal(beatText(beat, state), "default");
  state.flags.two = true;
  assert.equal(beatText(beat, state), "second");
  state.flags.one = true;
  assert.equal(beatText(beat, state), "first");
  assert.strictEqual(visibleBeats({ beats: [beat] }, state)[0], beat);
});

test("Every same-day scene transition keeps the displayed clock monotonic", () => {
  for (const scene of Object.values(story.scenes))
    for (const target of [
      ...targets(scene.next),
      ...(scene.choices || []).flatMap((c) => targets(c.next)),
    ]) {
      const next = story.scenes[target];
      if (/^\d{2}:\d{2}$/.test(scene.time) && /^\d{2}:\d{2}$/.test(next.time))
        assert.ok(
          next.time >= scene.time,
          `${scene.id} ${scene.time} -> ${target} ${next.time}`,
        );
    }
});
