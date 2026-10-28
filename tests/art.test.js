import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { portraitFor, discoveredCGs } from "../src/presentation.js";
const story = JSON.parse(
  fs.readFileSync(new URL("../src/story.json", import.meta.url)),
);
const art = JSON.parse(
  fs.readFileSync(new URL("../assets/manifest.json", import.meta.url)),
);
test("Medical calls use immobilized patient art while historical recordings keep work clothes", () => {
  const state = { beat: 1, flags: {} };
  assert.match(
    portraitFor(art, story.scenes.c3_05, state, "lin", "concern"),
    /medical-concern/,
  );
  assert.match(
    portraitFor(art, story.scenes.c3_02, state, "lin", "neutral"),
    /lin-neutral/,
  );
  assert.equal(story.scenes.c3_05.bg, "medical");
});
test("Injury art starts after the accident and persists into later testimony", () => {
  const state = { beat: 2, flags: { zhouWounded: true } };
  assert.doesNotMatch(
    portraitFor(art, story.scenes.c4_record, state, "zhou", "neutral"),
    /wounded/,
  );
  state.beat = 7;
  assert.match(
    portraitFor(art, story.scenes.c4_record, state, "zhou", "concern"),
    /wounded/,
  );
  assert.match(
    portraitFor(art, story.scenes.c4_cooperate, state, "zhou", "admit"),
    /wounded/,
  );
});
test("CG unlocks require reading the actual event, never merely entering its scene", () => {
  assert.equal(discoveredCGs(story, []).size, 0);
  assert.equal(discoveredCGs(story, ["c1_01:0"]).size, 0);
  assert.deepEqual([...discoveredCGs(story, ["c1_arm:0"])], ["awakening"]);
  assert.deepEqual([...discoveredCGs(story, ["end_lastlight:4"])], []);
  assert.deepEqual([...discoveredCGs(story, ["end_lastlight:6"])], ["reset"]);
});
test("Event pictures do not promise successful rescue or departure on losing branches", () => {
  assert.ok(story.scenes.c4_rescue.beats.some((b) => b.cg === "rescue"));
  for (const id of ["c4_broken_arm", "c4_force", "c4_injury", "c4_record"])
    assert.ok(story.scenes[id].beats.every((b) => b.cg !== "rescue"));
  assert.ok(story.scenes.c1_01.beats.every((b) => !b.cg));
  for (const [id, scene] of Object.entries(story.scenes))
    if (id !== "end_dawn")
      assert.ok(scene.beats.every((b) => b.cg !== "departure"));
});

test("Remote accident shots remain in the archive until arrival and hide the fallen character", () => {
  assert.equal(story.scenes.c4_record.bg, "archive-alert");
  assert.equal(
    story.scenes.c4_record.beats[2].communication,
    "远程通信 · 维护区",
  );
  assert.equal(story.scenes.c4_record.beats[5].background, "maintenance");
  assert.deepEqual(story.scenes.c4_injury.beats[2].hideCharacters, ["zhou"]);
});
