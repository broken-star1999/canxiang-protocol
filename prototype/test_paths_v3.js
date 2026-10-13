// Engine v3 path checks for chapter one parity and chapter two's new story fields.
"use strict";

const fs = require("fs");
const path = require("path");
const E0 = require("./engine.js");
const E = require("./engine_v3.js");
const D = JSON.parse(fs.readFileSync(path.join(__dirname, "data_v4.json"), "utf8"));
const chapterById = Object.fromEntries((D.chapters || []).map(chapter => [chapter.id, chapter]));
const failures = [];
const MAX_STATES = 200000;

function check(name, fn) {
  try {
    const detail = fn();
    console.log("PASS " + name + (detail ? " — " + detail : ""));
  } catch (error) {
    failures.push({ name, error });
    console.error("FAIL " + name + " — " + error.message);
  }
}
function expect(value, message) {
  if (!value) throw new Error(message);
}
function stableObject(object) {
  return Object.fromEntries(Object.keys(object || {}).sort().map(key => [key, object[key]]));
}
function stateKey(state) {
  return JSON.stringify([
    state.scene, state.mins, [...(state.flags || [])].sort(), stableObject(state.vals),
    stableObject(state.echoes), [...(state.bonuses || [])].sort()
  ]);
}
function importedDefaults(chapter) {
  const ids = new Set((chapter.imports || {}).echoes || []);
  return Object.fromEntries((D.echoes || []).filter(echo => ids.has(echo.id)).map(echo => [echo.id, echo.default]));
}
function sceneTable(chapter) {
  return Object.fromEntries((chapter.scenes || []).map(scene => [scene.id, scene]));
}
function chapterMinutes(chapter) {
  const start = (chapter.clock.start || "00:00").split(":").map(Number);
  const end = (chapter.clock.end || "00:00").split(":").map(Number);
  return end[0] * 60 + end[1] - start[0] * 60 - start[1];
}
function reachableTransitions(engine, chapter) {
  const scenes = sceneTable(chapter);
  const start = engine.initState(chapter, {
    values: engine.carryValues({}, chapter), echoes: importedDefaults(chapter), flags: []
  });
  start.scene = chapter.entry || start.scene;
  const states = new Map();
  const transitions = new Map();
  const queue = [start];
  let truncated = false;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const state = queue[cursor];
    const key = stateKey(state);
    if (states.has(key)) continue;
    if (states.size >= MAX_STATES) { truncated = true; break; }
    states.set(key, state);
    const scene = scenes[state.scene];
    if (!scene || !(scene.choices || []).length) {
      transitions.set(key, JSON.stringify({ terminal: state.scene || null }));
      continue;
    }
    const edges = [];
    for (const choice of engine.visibleChoices(scene, state, chapter)) {
      const next = engine.clone(state);
      engine.apply(next, choice, chapter);
      if (chapter.clock && chapter.clock.closing_scene && scene.id !== chapter.clock.closing_scene &&
          next.mins >= chapterMinutes(chapter)) next.scene = chapter.clock.closing_scene;
      edges.push([choice.id, stateKey(next)]);
      queue.push(next);
    }
    edges.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    transitions.set(key, JSON.stringify(edges));
  }
  return { states, transitions, truncated };
}
function freshState(chapter, scene, options = {}) {
  const state = E.initState(chapter, {
    scene,
    values: options.values || {},
    flags: options.flags || [],
    echoes: options.echoes || {}
  });
  return state;
}
function getScene(chapter, id) {
  const scene = (chapter.scenes || []).find(item => item.id === id);
  if (!scene) throw new Error("缺少场景 " + id);
  return scene;
}
function getChoice(chapter, sceneId, choiceId) {
  const scene = getScene(chapter, sceneId);
  const choice = (scene.choices || []).find(item => item.id === choiceId);
  if (!choice) throw new Error("缺少选项 " + sceneId + "/" + choiceId);
  return { scene, choice };
}

const c1 = chapterById.c1;
const c2 = chapterById.c2;
check("第一章 engine.js 与 engine_v3.js 转移差异为 0", () => {
  expect(c1 && (c1.scenes || []).length > 0, "data_v4 中没有可枚举的第一章");
  const oldPaths = reachableTransitions(E0, c1);
  const newPaths = reachableTransitions(E, c1);
  expect(!oldPaths.truncated && !newPaths.truncated, "路径枚举超过状态上限");
  const keys = new Set([...oldPaths.transitions.keys(), ...newPaths.transitions.keys()]);
  const diffs = [...keys].filter(key => oldPaths.transitions.get(key) !== newPaths.transitions.get(key));
  expect(diffs.length === 0, "转移差异数=" + diffs.length + (diffs[0] ? "，首个差异=" + diffs[0] : ""));
  return `状态 ${oldPaths.states.size} / ${newPaths.states.size}，差异 0`;
});

check("第二章 next 列表有无条件末项且所有目标存在", () => {
  expect(c2 && (c2.scenes || []).length > 0, "data_v4 中没有第二章场景");
  const ids = new Set((c2.scenes || []).map(scene => scene.id));
  for (const scene of c2.scenes || []) for (const choice of scene.choices || []) {
    if (Array.isArray(choice.next)) {
      expect(choice.next.length > 0, `${scene.id}/${choice.id}: next 列表为空`);
      choice.next.forEach((branch, index) => {
        expect(branch && typeof branch === "object" && !Array.isArray(branch), `${scene.id}/${choice.id}: next[${index}] 格式无效`);
        expect(typeof branch.to === "string" && ids.has(branch.to), `${scene.id}/${choice.id}: next[${index}].to 不存在`);
        expect(index === choice.next.length - 1 ? !Object.prototype.hasOwnProperty.call(branch, "when") :
          Object.prototype.hasOwnProperty.call(branch, "when"), `${scene.id}/${choice.id}: next 条件/兜底顺序无效`);
      });
    } else if (choice.next) {
      expect(ids.has(choice.next), `${scene.id}/${choice.id}: next 目标 ${choice.next} 不存在`);
    }
  }
  return `${ids.size} 个场景，所有选项目标有效`;
});

check("第二章 v2 数值表联动奖励未被旧配置覆盖", () => {
  const bonuses = Object.fromEntries((c2.bonuses || []).map(item => [item.id, item]));
  const expected = ["b_arm_glove", "b_cache_mira", "b_mira_tang", "b_zhou_both"];
  expect(expected.every(id => bonuses[id]), "缺少第二章联动奖励: " + expected.filter(id => !bonuses[id]).join(", "));
  expect(bonuses.b_zhou_both.effects.EVD === 5 && bonuses.b_zhou_both.when.includes("c2_letter==copied"),
    "b_zhou_both 没有使用 c2_effects_v2 定义");
  return `${expected.length} 条联动奖励有效，b_zhou_both 采用第二章 v2 定义`;
});

check("第二章全部 when 可解析，非法 when 报错并带场景 id", () => {
  const probe = freshState(c2, c2.entry, { values: { EVD: 3, TRU: 55, EXP: 2, SLF: 5 } });
  const parseWhen = (condition, sceneId) => {
    if (condition === "default") return;
    E.evalWhen(condition, probe, c2, sceneId);
  };
  for (const scene of c2.scenes || []) {
    for (const variant of [...(scene.text_variants || []), ...(scene.text_append || [])]) parseWhen(variant.when, scene.id);
    for (const choice of scene.choices || []) {
      if (Object.prototype.hasOwnProperty.call(choice, "when")) parseWhen(choice.when, scene.id);
      for (const branch of Array.isArray(choice.next) ? choice.next : []) parseWhen(branch.when, scene.id);
      for (const variant of choice.result_variants || []) parseWhen(variant.when, scene.id);
    }
  }
  for (const ending of c2.endings || []) {
    parseWhen(ending.when, c2.entry);
    for (const variant of ending.text_variants || []) parseWhen(variant.when, c2.entry);
    for (const variant of ending.missed_variants || ending.review && ending.review.missed_variants || []) parseWhen(variant.when, c2.entry);
  }
  for (const bonus of c2.bonuses || []) parseWhen(bonus.when, c2.entry);
  let message = "";
  try { E.evalWhen("TRU >>> 3", probe, c2, "c2_s02a"); }
  catch (error) { message = error.message; }
  expect(message.includes("c2_s02a") && message.includes("when 解析失败"), "非法 when 未抛出带场景 id 的解析错误");
  return "合法条件全部通过；非法条件报错含 c2_s02a";
});

check("表达式运算符、echo、flag 和数值解析", () => {
  const state = { scene: "c2_s02a", vals: { TRU: 5, SLF: 4, EVD: 3, EXP: 9 }, flags: ["x"], echoes: { c1_mira: "forced" } };
  const tests = [
    ["TRU == 5", true], ["SLF != 5", true], ["EVD >= 3", true], ["EXP <= 9", true],
    ["TRU > 4", true], ["SLF < 5", true], ["flag:x", true], ["!flag:missing", true],
    ["echo:c1_mira == forced", true], ["echo:c1_mira in [asked,forced]", true],
    ["(TRU == 5 && flag:x) || SLF == 0", true], ["false || true", true], ["false && true", false]
  ];
  for (const [source, expected] of tests) expect(E.evalWhen(source, state, c2, state.scene) === expected, "表达式结果错误: " + source);
  const source = fs.readFileSync(path.join(__dirname, "engine_v3.js"), "utf8");
  expect(!/\beval\s*\(/.test(source) && !/\bFunction\s*\(/.test(source), "引擎包含 eval 或 Function");
  return `${tests.length} 条表达式通过，无动态代码求值`;
});

check("c2_s05a 正文变体先于顺序追加，问句只出现一次", () => {
  const scene = getScene(c2, "c2_s05a");
  const state = freshState(c2, scene.id, { echoes: { c1_mira: "forced", c2_stance: "silent" } });
  const text = E.sceneText(scene, state, c2);
  const marker = text.indexOf("核对一个编号");
  const question = text.indexOf("「你到底是谁？」");
  const count = text.split("你到底是谁？").length - 1;
  expect(marker >= 0 && question > marker && count === 1, "正文顺序/问句次数错误");
  return "核对编号 → 你到底是谁？，问句 1 次";
});

check("c2_s00a 保留主文本并按顺序追加命中内容", () => {
  const scene = getScene(c2, "c2_s00a");
  const state = freshState(c2, scene.id, { echoes: { c1_mira: "forced", c1_cache: "mail" } });
  const text = E.sceneText(scene, state, c2);
  const forced = text.indexOf("五点三十");
  const mail = text.indexOf("外发邮件 1 封");
  expect(text.startsWith("对讲屏亮着") && forced > 0 && mail > forced, "主文本或追加顺序错误");
  return "主文本 → forced → mail";
});

check("text_by_echo 整段替换后仍追加命中内容", () => {
  const scene = {
    id: "echo_probe", text: "主文本", text_variants: [{ when: "true", text: "变体" }],
    text_by_echo: { c2_letter: { copied: "回响整段" } },
    text_append: [{ when: "true", text: "追加" }]
  };
  const text = E.sceneText(scene, freshState(c2, scene.id, { echoes: { c2_letter: "copied" } }), c2);
  expect(text === "回响整段追加", "text_by_echo 没有整段替换或追加顺序错误: " + text);
  return "回响正文替换变体，追加仍排在末尾";
});

check("ring、ask、copied 与 WHO / HEARD / TAKE 各自显示路线句子", () => {
  const ring = getChoice(c2, "c2_s00a", "c2_s00a_ring");
  const ringState = freshState(c2, ring.scene.id, { flags: ["login_mira"] });
  expect(E.choiceResult(ring.choice, ringState, c2).includes("那一笔还记在我名下"), "ring 未命中 login_mira 结果变体");

  const ask = getChoice(c2, "c2_s01a", "c2_s01a_ask");
  const askState = freshState(c2, ask.scene.id, { echoes: { c1_mira: "asked" } });
  expect(E.choiceResult(ask.choice, askState, c2).includes("唐棠在上面"), "ask 未命中 c1_mira 结果");

  const copied = getChoice(c2, "c2_s04a", "c2_s04a_copied");
  const copiedState = freshState(c2, copied.scene.id, { echoes: { c1_cache: "mira" } });
  E.apply(copiedState, copied.choice, c2);
  expect(E.choiceResult(copied.choice, copiedState, c2).includes("和上一次的放在一起"), "copied 未命中 c1_cache 结果");

  const who = E.ending(c2, freshState(c2, "c2_end", {
    values: { SLF: 35 }, flags: ["c2_answered_dunno"], echoes: { c2_letter: "copied" }
  }));
  expect(who && who.id === "C2_E_WHO" && who.review.missed[0].includes("你存下了那封信"), "WHO 结局/遗漏变体错误");

  const heard = E.ending(c2, freshState(c2, "c2_end", {
    flags: ["zhou_heard"], echoes: { c2_letter: "copied" }
  }));
  expect(heard && heard.id === "C2_E_HEARD" && heard.review.missed[0].includes("你存下了它"), "HEARD 结局/遗漏变体错误");

  const take = E.ending(c2, freshState(c2, "c2_end", { echoes: { c2_letter: "unread" } }));
  expect(take && take.id === "C2_E_TAKE" && take.text.includes("你什么都没带走"), "TAKE 结局正文变体错误");
  return "6 条路线句子与结局变体命中";
});

check("未捡手套时 s01b 正文、tang 和 self 使用另一版", () => {
  const scene = getScene(c2, "c2_s01b");
  const state = freshState(c2, scene.id);
  expect(E.sceneText(scene, state, c2).includes("那只手套还躺在对讲屏下面"), "未捡手套正文变体未命中");
  const tang = getChoice(c2, scene.id, "c2_s01b_tang");
  expect(E.choiceResult(tang.choice, state, c2).includes("等她的人来收"), "tang 结果变体未命中");
  const self = getChoice(c2, scene.id, "c2_s01b_self");
  expect(E.choiceResult(self.choice, state, c2).includes("你没碰它"), "self 结果变体未命中");
  return "正文、tang、self 三处变体命中";
});

check("c2_s01b_self 增加 SLF 5，tang/lin 不改变 SLF", () => {
  for (const [choiceId, expected] of [["c2_s01b_self", 17], ["c2_s01b_tang", 12], ["c2_s01b_lin", 12]]) {
    const state = freshState(c2, "c2_s01b", { values: { SLF: 12 } });
    const { choice } = getChoice(c2, "c2_s01b", choiceId);
    E.apply(state, choice, c2);
    expect(state.vals.SLF === expected, `${choiceId}: SLF=${state.vals.SLF}, 预期 ${expected}`);
  }
  return "self +5；tang/lin ±0";
});

check("c2_s02a 条件 next 的 TRU 与 SLF 两侧分别命中", () => {
  const play = getChoice(c2, "c2_s02a", "c2_s02a_play");
  const playState = freshState(c2, play.scene.id, { values: { TRU: 55, SLF: 0 } });
  E.apply(playState, play.choice, c2);
  expect(playState.scene === "c2_s03a_heard", "TRU >= 55 一侧没有命中");

  const silent = getChoice(c2, "c2_s02a", "c2_s02a_silent");
  const silentState = freshState(c2, silent.scene.id, { values: { TRU: 0, SLF: 20 } });
  E.apply(silentState, silent.choice, c2);
  expect(silentState.scene === "c2_s03a_heard", "SLF >= 30 一侧没有命中");
  expect(silentState.vals.SLF === 30, "silent 的 SLF effects 没有先于 next 生效");
  return "TRU=55/SLF=0 与 SLF=20 经 effects 到 30 均进入 heard";
});

check("条件 next 在判定前结算 effects、echo_set 和 flags_set", () => {
  const probeChapter = { id: "probe", entry: "start", values: { EVD: 0 }, bonuses: [] };
  const state = E.initState(probeChapter, { scene: "start", values: { EVD: 0 } });
  E.apply(state, {
    id: "ordered", key: true, effects: { EVD: 1 }, echo_set: { c2_stance: "silent" }, flags_set: ["ready"],
    next: [
      { when: "EVD == 1 && echo:c2_stance==silent && flag:ready", to: "matched" },
      { to: "fallback" }
    ]
  }, probeChapter);
  expect(state.scene === "matched", "next 判定发生在 effects/echo_set/flags_set 之前");
  return "三类状态更新都已被 next 条件读取";
});

if (failures.length) {
  console.error(`\n失败 ${failures.length} 项`);
  process.exitCode = 1;
} else {
  console.log("\n全部路径与引擎用例通过。");
}
