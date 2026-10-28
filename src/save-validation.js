import { matches } from "./conditions.js";
// The v2 save wire format is shared by browser loading, import and flow snapshots.
const object = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);
const safeKey = (key) =>
  /^[a-zA-Z0-9_-]{1,80}$/.test(key) &&
  !["__proto__", "constructor", "prototype"].includes(key);
const text = (value, max = 10000) =>
  typeof value === "string" && value.length <= max;
const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};
const list = (value, max, predicate) =>
  Array.isArray(value) && value.length <= max && value.every(predicate);
const own = (map, id) => typeof id === "string" && Object.hasOwn(map, id);

export const defaults = Object.freeze({
  speed: 32,
  font: 22,
  music: 0.55,
  sfx: 0.55,
  auto: 2600,
  reduced: false,
  timed: false,
});

export function validateSave(input, story, depth = 0) {
  assert(
    depth <= 1 &&
      object(input) &&
      input.version === 2 &&
      own(story.scenes, input.scene),
    "存档版本或场景不兼容",
  );
  assert(
    Number.isInteger(input.beat) && input.beat >= 0 && input.beat <= 500,
    "阅读进度无效",
  );
  assert(
    object(input.values) &&
      ["trust", "zhou", "self"].every(
        (k) =>
          Number.isFinite(input.values[k]) && Math.abs(input.values[k]) < 1000,
      ),
    "数值无效",
  );
  assert(
    object(input.flags) &&
      Object.entries(input.flags).every(
        ([k, v]) =>
          safeKey(k) &&
          (typeof v === "boolean" ||
            text(v, 1000) ||
            (typeof v === "number" && Number.isFinite(v))),
      ),
    "状态无效",
  );
  assert(
    list(input.evidence, 1000, (k) => own(story.evidence, k)),
    "证据无效",
  );
  assert(
    list(input.echoes, 1000, (k) => own(story.echoes, k)),
    "回响无效",
  );
  assert(
    list(
      input.history,
      2000,
      (h) =>
        object(h) &&
        own(story.scenes, h.scene) &&
        Number.isInteger(h.beat) &&
        h.beat >= 0 &&
        h.beat < 500 &&
        text(h.text) &&
        text(h.speaker, 100) &&
        text(h.time, 100),
    ),
    "日志无效",
  );
  assert(
    list(
      input.choices,
      500,
      (c) =>
        object(c) &&
        own(story.scenes, c.scene) &&
        story.scenes[c.scene].choices?.some((choice) => choice.id === c.id) &&
        text(c.text),
    ),
    "选择记录无效",
  );
  assert(
    input.path === undefined ||
      list(input.path, 200, (id) => own(story.scenes, id)),
    "路线记录无效",
  );
  assert(object(input.checkpoints), "章节记录无效");
  assert(input.ending == null || own(story.endings, input.ending), "结局无效");
  assert(
    input.chapter === undefined ||
      story.chapters.some((c) => c.id === input.chapter),
    "章节无效",
  );
  for (const key of ["startedAt", "lastSaved"])
    assert(
      input[key] === undefined ||
        (Number.isFinite(input[key]) && input[key] >= 0),
      "存档时间无效",
    );
  for (const [id, checkpoint] of Object.entries(input.checkpoints)) {
    assert(
      story.chapters.some((c) => c.id === id) &&
        object(checkpoint) &&
        object(checkpoint.checkpoints) &&
        Object.keys(checkpoint.checkpoints).length === 0,
      "章节无效",
    );
    validateSave(checkpoint, story, depth + 1);
  }
  assert(
    input.beat <=
      story.scenes[input.scene].beats.filter((beat) =>
        matches(beat.when, input),
      ).length,
    "阅读进度超出当前场景",
  );
  const clean = structuredClone(input);
  clean.path ??= [];
  return clean;
}

export function normalizeSettings(settings = {}) {
  assert(object(settings), "阅读设置无效");
  const result = { ...defaults };
  for (const [key, min, max] of [
    ["speed", 0, 80],
    ["font", 16, 28],
    ["music", 0, 1],
    ["sfx", 0, 1],
    ["auto", 800, 6000],
  ]) {
    if (settings[key] !== undefined) {
      assert(
        typeof settings[key] === "number" &&
          Number.isFinite(settings[key]) &&
          settings[key] >= min &&
          settings[key] <= max,
        "阅读设置无效：" + key,
      );
      result[key] = settings[key];
    }
  }
  for (const key of ["reduced", "timed"]) {
    assert(
      settings[key] === undefined || typeof settings[key] === "boolean",
      "阅读设置无效：" + key,
    );
    result[key] = settings[key] ?? defaults[key];
  }
  return result;
}

export function validateCollection(collection, story) {
  assert(object(collection), "收集数据无效");
  const c = structuredClone(collection);
  for (const key of ["endings", "evidence", "echoes"])
    assert(
      list(c[key], 1000, (k) => own(story[key], k)),
      "收集项目无效",
    );
  assert(
    list(c.chapters, 100, (id) => story.chapters.some((ch) => ch.id === id)),
    "收集章节无效",
  );
  assert(
    list(c.read, 10000, (id) => {
      if (!text(id, 100)) return false;
      const [scene, index, ...rest] = id.split(":");
      return (
        !rest.length &&
        own(story.scenes, scene) &&
        /^\d+$/.test(index) &&
        Number(index) < story.scenes[scene].beats.length
      );
    }),
    "已读记录无效",
  );
  c.nodes ??= [];
  c.edges ??= [];
  assert(
    list(c.nodes, 10000, (id) => own(story.scenes, id)),
    "剧情节点无效",
  );
  assert(
    list(
      c.edges,
      10000,
      (edge) =>
        text(edge, 200) &&
        edge.split(">").length === 2 &&
        edge.split(">").every((id) => own(story.scenes, id)),
    ),
    "剧情连线无效",
  );
  return c;
}

export function validatePoints(points = {}, story) {
  assert(
    object(points) &&
      Object.keys(points).length <= Object.keys(story.scenes).length,
    "节点存档无效",
  );
  const clean = {};
  for (const [id, variants] of Object.entries(points)) {
    assert(
      own(story.scenes, id) &&
        list(
          variants,
          3,
          (p) => object(p) && text(p.key, 50000) && p.state?.scene === id,
        ),
      "节点存档无效",
    );
    clean[id] = variants.map((p) => ({
      key: p.key,
      state: validateSave(p.state, story),
    }));
  }
  return clean;
}

export function normalizeEnvelope(input, story, { importing = false } = {}) {
  assert(
    object(input) &&
      input.format === 1 &&
      (!importing || input.game === "canxiang-vn"),
    "请选择《残响协议》的存档文件",
  );
  assert(Array.isArray(input.slots) && input.slots.length === 6, "存档槽无效");
  return {
    auto: input.auto == null ? null : validateSave(input.auto, story),
    slots: input.slots.map((s) => (s == null ? null : validateSave(s, story))),
    points: validatePoints(input.points, story),
    collection: validateCollection(input.collection, story),
    settings: normalizeSettings(input.settings),
  };
}
