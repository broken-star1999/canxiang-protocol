import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { gunzipSync } from "node:zlib";
import { Saves, KEY } from "../src/storage.js";
import { newState, validateSave } from "../src/engine.js";

const json = (name) =>
  JSON.parse(fs.readFileSync(new URL(name, import.meta.url)));
const story = json("../src/story.json");
const oldStory = JSON.parse(
  gunzipSync(
    fs.readFileSync(
      new URL("fixtures/story-before-refactor.json.gz", import.meta.url),
    ),
  ),
);
const fixtures = JSON.parse(
  gunzipSync(
    fs.readFileSync(new URL("fixtures/legacy-v2.json.gz", import.meta.url)),
  ),
);
const memory = () => {
  const map = new Map();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
};

test("All 228 baseline v2 saves retain progress, six slots, collections and rewind variants", () => {
  for (const fixture of fixtures) {
    const storage = memory();
    storage.setItem(KEY, JSON.stringify(fixture.envelope));
    const saves = new Saves(story, storage);
    assert.equal(saves.memory, false, `${fixture.scene}:${fixture.beat}`);
    const exported = JSON.parse(saves.export());
    for (const field of ["auto", "slots", "points", "collection", "settings"])
      assert.deepEqual(exported[field], fixture.envelope[field]);
    const imported = new Saves(story, memory());
    imported.import(saves.export());
    assert.deepEqual(imported.data, saves.data);
    for (const variants of Object.values(saves.data.points))
      for (const variant of variants)
        assert.deepEqual(validateSave(variant.state, story), variant.state);
  }
  assert.deepEqual(
    [
      ...new Set(fixtures.map((f) => f.envelope.auto.ending).filter(Boolean)),
    ].sort(),
    Object.keys(story.endings).sort(),
  );
});

test("Scene, choice, beat indices and causal rules are identical to the legacy story", () => {
  assert.deepEqual(Object.keys(story.scenes), Object.keys(oldStory.scenes));
  assert.deepEqual(
    story.chapters.map((c) => [c.id, c.entry, c.scenes]),
    oldStory.chapters.map((c) => [c.id, c.entry, c.scenes]),
  );
  const rules = (scene) => ({
    next: scene.next,
    grant: scene.grant,
    setFlags: scene.setFlags,
    ending: scene.ending,
    timer: scene.timer,
    beats: scene.beats.map((b) => b.when),
    choices: scene.choices?.map(({ text, lockedText, ...rest }) => rest),
  });
  for (const id of Object.keys(story.scenes))
    assert.deepEqual(rules(story.scenes[id]), rules(oldStory.scenes[id]), id);
});

test("Every production art file retains its baseline SHA-256", () => {
  const baseline = json("../docs/refactor/baseline.json");
  for (const [path, sha] of Object.entries(baseline.assets))
    assert.equal(
      crypto
        .createHash("sha256")
        .update(fs.readFileSync(new URL("../" + path, import.meta.url)))
        .digest("hex"),
      sha,
      path,
    );
});

test("Invalid import is transactional, including malformed choices, settings, history and points", () => {
  const storage = memory(),
    saves = new Saves(story, storage);
  saves.save(newState(story));
  const original = saves.export(),
    persisted = storage.getItem(KEY);
  for (const mutate of [
    (d) => (d.auto.choices = [null]),
    (d) => (d.auto.choices = [{ scene: "c1_02", id: "missing", text: "x" }]),
    (d) => (d.settings.music = "loud"),
    (d) => (d.settings.reduced = "false"),
    (d) => (d.auto.history = [null]),
    (d) => (d.collection.read = ["c1_01:999"]),
    (d) =>
      (d.points.c1_01 = [{ key: "x", state: { ...d.auto, scene: "c2_01" } }]),
  ]) {
    const data = JSON.parse(original);
    mutate(data);
    assert.throws(() => saves.import(JSON.stringify(data)));
    assert.equal(saves.export(), original);
    assert.equal(storage.getItem(KEY), persisted);
  }
  storage.setItem = () => {
    throw Error("quota");
  };
  const valid = JSON.parse(original);
  valid.auto.flags.changed = true;
  assert.throws(() => saves.import(JSON.stringify(valid)), /原进度未更改/);
  assert.equal(saves.export(), original);
  assert.equal(storage.getItem(KEY), persisted);
});

test("Corrupt local data is retained and can be exported verbatim while in-memory play continues", () => {
  const storage = memory(),
    raw = '{"坏存档":\n broken 😀';
  storage.setItem(KEY, raw);
  const saves = new Saves(story, storage);
  assert.equal(saves.memory, true);
  assert.equal(saves.exportRaw(), raw);
  saves.save(newState(story));
  assert.ok(JSON.parse(saves.export()).auto);
  assert.equal(storage.getItem(KEY), raw);
  assert.equal(saves.exportRaw(), raw);
});
