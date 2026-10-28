import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CharacterMotion, characterDirection } from "../src/character-motion.js";
import { Effects } from "../src/effects.js";

function environment(t) {
  const names = ["document", "MutationObserver", "Image"];
  const original = Object.fromEntries(names.map((key) => [key, globalThis[key]]));
  const classes = new Set();
  const body = {
    dataset: { view: "game" },
    classList: { contains: (name) => classes.has(name) },
  };
  const nodes = new Map([
    ["body", body],
    ["#panel", { open: false }],
    ["#confirm", { open: false }],
    ["#chapterCurtain", { hidden: true }],
    ["#endingScreen", { hidden: true }],
  ]);
  const observers = [];
  globalThis.document = Object.assign(new EventTarget(), {
    hidden: false,
    body,
    querySelector: (key) => nodes.get(key),
  });
  globalThis.MutationObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  t.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
  return { nodes, classes, observers };
}

test("Character direction preserves medical context and the reset's mechanical stillness", () => {
  assert.deepEqual(characterDirection("mira", "concern", "desync"), {
    idle: "mira", stance: "guarded",
  });
  assert.deepEqual(characterDirection("mira", "reset", "restore"), {
    idle: "still", stance: "formal",
  });
  assert.equal(characterDirection("mira", "hurt", "shutdown").stance, "offline");
  assert.equal(characterDirection("lin", "concern", "admit", {
    costume: "medical",
  }).idle, "medical");
  assert.equal(characterDirection("zhou", "admit", "resolve", {
    wounded: true,
  }).idle, "wounded");
  const story = JSON.parse(fs.readFileSync(new URL("../src/story.json", import.meta.url)));
  for (const [scene, beat, actor, cue] of [
    ["c3_witness", 6, "mira", "desync"],
    ["c3_06", 9, "lin", "resolve"],
    ["end_lastlight", 4, "mira", "shutdown"],
    ["end_lastlight", 6, "mira", "restore"],
  ]) assert.equal(story.scenes[scene].beats[beat].stage[actor], cue);
});

test("Character gestures stop for menus, background, skip, reduced motion and disposal without replay", (t) => {
  const { nodes, classes, observers } = environment(t);
  const root = { dataset: {} };
  const layer = {};
  const slot = { dataset: {}, querySelector: () => layer };
  let reduced = false;
  const animations = [];
  const effects = {
    reduced: () => reduced,
    animate: (element) => {
      assert.equal(element, layer);
      const animation = {
        cancelled: false,
        finished: new Promise(() => {}),
        cancel() { this.cancelled = true; },
      };
      animations.push(animation);
      return animation;
    },
  };
  const motion = new CharacterMotion(root, effects);
  const direction = characterDirection("mira", "concern", "desync");
  motion.present(slot, direction, "reveal:6", "desync");
  motion.present(slot, direction, "reveal:6", "desync");
  assert.equal(animations.length, 1);
  assert.equal(root.dataset.performance, "running");
  for (const [pause, resume] of [
    [() => { nodes.get("#panel").open = true; }, () => { nodes.get("#panel").open = false; }],
    [() => { nodes.get("#confirm").open = true; }, () => { nodes.get("#confirm").open = false; }],
    [() => { document.hidden = true; }, () => { document.hidden = false; }],
    [() => { classes.add("reading-skip"); }, () => { classes.delete("reading-skip"); }],
    [() => { classes.add("cg-active"); }, () => { classes.delete("cg-active"); }],
    [() => { reduced = true; }, () => { reduced = false; }],
  ]) {
    const count = animations.length;
    pause();
    observers[0].callback();
    assert.equal(root.dataset.performance, "paused");
    assert.ok(animations.at(-1).cancelled);
    motion.present(slot, direction, "paused:" + count, "desync");
    resume();
    document.dispatchEvent(new Event("visibilitychange"));
    observers[0].callback();
    motion.present(slot, direction, "paused:" + count, "desync");
    assert.equal(animations.length, count);
    motion.present(slot, direction, "next:" + count, "desync");
    assert.equal(animations.length, count + 1);
  }
  motion.clear();
  assert.equal(slot.dataset.stance, undefined);
  assert.ok(animations.at(-1).cancelled);
  motion.dispose();
  assert.ok(observers[0].disconnected);
  assert.equal(root.dataset.performance, "paused");
  motion.present(slot, direction, "after-dispose", "desync");
  assert.equal(slot.dataset.stance, undefined);
});

test("Slow portrait decoding only performs the latest beat, including a repeated image URL", async (t) => {
  environment(t);
  const decoders = [];
  globalThis.Image = class {
    complete = false;
    decode() { return new Promise((resolve) => decoders.push(resolve)); }
  };
  const main = {
    style: {}, src: "", getAnimations: () => [], getAttribute: () => "",
  };
  const ghost = { hidden: true, getAnimations: () => [] };
  const slot = {
    dataset: {},
    querySelector: (key) => key === ".portrait-main" ? main : ghost,
  };
  const effects = Object.assign(Object.create(Effects.prototype), {
    portraits: new Map(), reduced: () => true,
  });
  const calls = [];
  effects.portrait(slot, "mira.webp", "mira", { onReady: () => calls.push("old beat") });
  effects.portrait(slot, "mira.webp", "mira", { onReady: () => calls.push("latest beat") });
  assert.deepEqual(calls, []);
  decoders[0]();
  await Promise.resolve();
  assert.deepEqual(calls, ["latest beat"]);
  effects.portrait(slot, "different.webp", "mira", { onReady: () => calls.push("stale scene") });
  effects.portrait(slot, "reset.webp", "mira", { onReady: () => calls.push("reset") });
  decoders[1]();
  await Promise.resolve();
  assert.deepEqual(calls, ["latest beat"]);
  decoders[2]();
  await Promise.resolve();
  assert.deepEqual(calls, ["latest beat", "reset"]);
  assert.equal(main.src, "reset.webp");
});
