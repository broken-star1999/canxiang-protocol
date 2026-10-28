import test from "node:test";
import assert from "node:assert/strict";
import { InputBindings } from "../src/controllers/input.js";
import { ReadingController } from "../src/controllers/reading.js";

function environment(t) {
  const old = {
    document: globalThis.document,
    window: globalThis.window,
    matchMedia: globalThis.matchMedia,
  };
  const elements = new Map(
    ["#dialogue", "#panel", "#confirm", "#endingScreen", "#importFile"].map(
      (id) => [
        id,
        Object.assign(new EventTarget(), { open: false, hidden: true }),
      ],
    ),
  );
  globalThis.document = Object.assign(new EventTarget(), {
    hidden: false,
    querySelector: (id) => elements.get(id),
  });
  globalThis.window = new EventTarget();
  globalThis.matchMedia = () => new EventTarget();
  t.after(() => {
    for (const [key, value] of Object.entries(old)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
  return elements;
}

test("Backgrounding cancels automatic progression, saves, pauses audio and resumes once visible", async (t) => {
  environment(t);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls = [];
  const game = {
    autoTimer: setTimeout(() => calls.push("unexpected advance"), 100),
    lastBg: "sea",
    save: () => calls.push("save"),
    scheduleAdvance: () => calls.push("schedule"),
    sound: {
      pause: () => calls.push("pause"),
      unlock: () => {
        calls.push("unlock");
        return Promise.resolve();
      },
      play: (mood) => calls.push("play:" + mood),
    },
  };
  const input = new InputBindings(game);
  input.mount();
  document.hidden = true;
  document.dispatchEvent(new Event("visibilitychange"));
  t.mock.timers.tick(1000);
  assert.deepEqual(calls, ["pause", "save"]);
  document.hidden = false;
  document.dispatchEvent(new Event("visibilitychange"));
  await Promise.resolve();
  assert.deepEqual(calls, ["pause", "save", "unlock", "schedule", "play:dawn"]);
  input.dispose();
  document.dispatchEvent(new Event("visibilitychange"));
  await Promise.resolve();
  assert.equal(calls.length, 5);
});

test("Reading timers stop for dialogs, choices, hidden pages and disposal", (t) => {
  const elements = environment(t);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let advances = 0;
  const game = {
    view: "game",
    curtain: false,
    inChoice: false,
    typing: false,
    auto: true,
    skip: false,
    settings: { auto: 800 },
    currentText: "test",
    advance: () => advances++,
  };
  const reading = new ReadingController(game);
  game.blocked = () => reading.blocked();
  for (const block of [
    () => {
      elements.get("#panel").open = true;
    },
    () => {
      game.inChoice = true;
    },
    () => {
      document.hidden = true;
    },
  ]) {
    elements.get("#panel").open = false;
    game.inChoice = false;
    document.hidden = false;
    block();
    reading.scheduleAdvance();
    t.mock.timers.tick(2000);
    assert.equal(advances, 0);
  }
  document.hidden = false;
  game.inChoice = false;
  reading.scheduleAdvance();
  t.mock.timers.tick(888);
  assert.equal(advances, 1);
  reading.scheduleAdvance();
  globalThis.cancelAnimationFrame = () => {};
  t.after(() => delete globalThis.cancelAnimationFrame);
  reading.stopReading();
  t.mock.timers.tick(2000);
  assert.equal(advances, 1);
});
