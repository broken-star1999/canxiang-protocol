// Engine v3 path checks for chapter one parity and chapter two's new story fields.
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const E0 = require("./engine.js");
const E = require("./engine_v3.js");
const bundle = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "data_v6.js"), "utf8"), bundle);
const D = bundle.window.STORY;
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
const c3 = chapterById.c3;
check("v6 沿用第一、二章源文件并接入指定的第三章 v2/v3 源文件", () => {
  const oldData = JSON.parse(fs.readFileSync(path.join(__dirname, "data_v4.json"), "utf8"));
  const oldChapters = Object.fromEntries((oldData.chapters || []).map(chapter => [chapter.id, chapter]));
  for (const id of ["c1", "c2"]) {
    expect(JSON.stringify((chapterById[id] || {})._sources) === JSON.stringify((oldChapters[id] || {})._sources), `${id} 数据源与 build_v4 不一致`);
  }
  for (const source of ["story/c3_draft_v2.yaml", "chapters/c3/endings_draft_v3.yaml", "puzzle/c3_effects_v2.yaml"])
    expect((D._sources || []).includes(source), `缺少第三章数据源 ${source}`);
  expect((c2.exports.flags || []).includes("c2_glove_guess_self"), "第二章没有导出 c2_glove_guess_self");
  expect((c3.imports.flags || []).includes("c2_glove_guess_self"), "第三章没有导入 c2_glove_guess_self");
  return "c1/c2 源列表与 v4 相同；c3 接入 v2/v3/v2 并传递手套 flag";
});

check("缺失美术资源在 images 中留空", () => {
  for (const key of D.missing_art || []) expect(D.images[key] === "", `${key} 缺图时没有留空`);
  expect((D.missing_art || []).length > 0, "缺图清单没有记录任何资源");
  return `${D.missing_art.length} 个缺图 key 均保留为空字符串`;
});

check("第一章 engine.js 与 engine_v3.js 转移差异为 0", () => {
  expect(c1 && (c1.scenes || []).length > 0, "data_v6 中没有可枚举的第一章");
  const oldPaths = reachableTransitions(E0, c1);
  const newPaths = reachableTransitions(E, c1);
  expect(!oldPaths.truncated && !newPaths.truncated, "路径枚举超过状态上限");
  const keys = new Set([...oldPaths.transitions.keys(), ...newPaths.transitions.keys()]);
  const diffs = [...keys].filter(key => oldPaths.transitions.get(key) !== newPaths.transitions.get(key));
  expect(diffs.length === 0, "转移差异数=" + diffs.length + (diffs[0] ? "，首个差异=" + diffs[0] : ""));
  return `状态 ${oldPaths.states.size} / ${newPaths.states.size}，差异 0`;
});

check("第二章 next 列表有无条件末项且所有目标存在", () => {
  expect(c2 && (c2.scenes || []).length > 0, "data_v6 中没有第二章场景");
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

check("第三章 next 列表有无条件末项且所有目标存在", () => {
  expect(c3 && (c3.scenes || []).length > 0, "data_v6 中没有第三章场景");
  const ids = new Set((c3.scenes || []).map(scene => scene.id));
  for (const scene of c3.scenes || []) for (const choice of scene.choices || []) {
    if (Array.isArray(choice.next)) {
      expect(choice.next.length > 0, `${scene.id}/${choice.id}: next 列表为空`);
      choice.next.forEach((branch, index) => {
        expect(branch && typeof branch === "object" && !Array.isArray(branch), `${scene.id}/${choice.id}: next[${index}] 格式无效`);
        expect(typeof branch.to === "string" && ids.has(branch.to), `${scene.id}/${choice.id}: next[${index}].to 不存在`);
        expect(index === choice.next.length - 1 ? !Object.prototype.hasOwnProperty.call(branch, "when") :
          Object.prototype.hasOwnProperty.call(branch, "when"), `${scene.id}/${choice.id}: next 条件/兜底顺序无效`);
      });
    } else {
      expect(typeof choice.next === "string" && choice.next.length > 0, `${scene.id}/${choice.id}: 缺少 next 目标`);
      expect(ids.has(choice.next), `${scene.id}/${choice.id}: next 目标 ${choice.next} 不存在`);
    }
  }
  return `${ids.size} 个场景，所有选项目标有效`;
});

check("第三章全部 when 可由 engine_v3 解析", () => {
  const probe = freshState(c3, c3.entry, {
    values: { EVD: 50, TRU: 50, EXP: 10, SLF: 45 },
    flags: ["c2_glove_guess_self"],
    echoes: { c1_mira: "forced", c2_stance: "confront", c2_letter: "kept_secret", c3_prior: "isolated", c3_tang: "called" }
  });
  let count = 0;
  function visit(value, where) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${where}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (key === "when") {
        expect(item === "default" || (E.evalWhen(item, probe, c3, where), true), `${where}: when 无法解析`);
        count++;
      }
      visit(item, `${where}.${key}`);
    }
  }
  visit(c3, "c3");
  return `${count} 个 when 全部可解析`;
});

function runC3Route(options = {}) {
  const state = freshState(c3, c3.entry, {
    values: options.values || {},
    flags: options.flags || [],
    echoes: options.echoes || {}
  });
  const route = options.route || [
    "c3_s00a_listen", "c3_s01a_continue", "c3_s02a_skip", "c3_s03a_isolate", "c3_s04a_not_call"
  ];
  const scenes = ["c3_s00a", "c3_s01a", "c3_s02b", "c3_s03a", "c3_s04a"];
  route.forEach((choiceId, index) => {
    if (index === 2) {
      expect(state.scene === "c3_s02a", `v2 过场前应在 c3_s02a，实际 ${state.scene}`);
      const transition = getChoice(c3, "c3_s02a", "c3_s02a_next");
      E.apply(state, transition.choice, c3);
      expect(state.scene === "c3_s02b", `c3_s02a_next 应进入 c3_s02b，实际 ${state.scene}`);
    }
    const { choice } = getChoice(c3, scenes[index], choiceId);
    E.apply(state, choice, c3);
  });
  return { state, ending: E.ending(c3, state) };
}

check("跨章回响显示强制开启，并将回放问句替换为对象信息缺失", () => {
  const forced = { c1_mira: "forced" };
  const start = getScene(c3, "c3_s00a");
  const startText = E.sceneText(start, freshState(c3, start.id, { echoes: forced }), c3);
  expect(startText.includes("已强制开启"), "开头没有显示已强制开启提示");
  const ask = getChoice(c3, "c3_s01a", "c3_s01a_ask_mira");
  const result = E.choiceResult(ask.choice, freshState(c3, ask.scene.id, { echoes: forced }), c3);
  expect(result.includes("对象信息缺失"), "强制开启路线没有命中对象信息缺失结果");
  expect(!result.includes("教一个要学会扶人的东西") && !result.includes("教一个以后要替她扶人的"), "强制开启路线仍显示其他回答");
  expect(!result.includes("MIRA 这次没有绕开"), "强制开启路线还命中了高 TRU 回答");
  const highTrustForced = freshState(c3, ask.scene.id, { values: { TRU: 60 }, echoes: forced });
  expect(E.choiceResult(ask.choice, highTrustForced, c3) === result, "forced 未优先于 TRU>=60 变体");
  return "开头提示；问句只显示对象缺失，且 forced 优先于高 TRU";
});

check("非强制且 TRU>=60 时‘她在教谁’出现高信任回答", () => {
  const ask = getChoice(c3, "c3_s01a", "c3_s01a_ask_mira");
  const state = freshState(c3, ask.scene.id, { values: { TRU: 60 }, echoes: { c1_mira: "asked" } });
  const result = E.choiceResult(ask.choice, state, c3);
  expect(result.includes("教一个以后要替她扶人的"), "TRU=60 且非强制未命中扩展回答");
  expect(result.includes("等它学会了"), "高信任回答缺少后半句");
  return "TRU=60、c1_mira=asked 命中高信任扩展回答";
});

check("第一章问过 MIRA 疼不疼时回放会回收问句", () => {
  const replay = getChoice(c3, "c3_s01a", "c3_s01a_continue");
  const asked = E.choiceResult(replay.choice, freshState(c3, replay.scene.id, { echoes: { c1_mira: "asked" } }), c3);
  const notAsked = E.choiceResult(replay.choice, freshState(c3, replay.scene.id, { echoes: { c1_mira: "forced" } }), c3);
  expect(asked.includes("刚才那一下，你疼吗？"), "c1_mira=asked 没有回收疼不疼问句");
  expect(!notAsked.includes("刚才那一下，你疼吗？"), "未问过疼不疼的路线也出现了回收问句");
  return "asked 有问句；forced 路线没有问句";
});

check("第二章对质路线在第三章开头显示内线已断", () => {
  const scene = getScene(c3, "c3_s00a");
  const text = E.sceneText(scene, freshState(c3, scene.id, { echoes: { c2_stance: "confront" } }), c3);
  expect(text.includes("内线电话早就断了"), "没有命中对质路线的断线追加文本");
  return "c2_stance=confront 命中断线文本";
});

check("v2 无数值过场进入 c3_s02b，04:39 正文与回看选项在实际场景", () => {
  const passage = getChoice(c3, "c3_s02a", "c3_s02a_next");
  expect(!passage.choice.effects || Object.keys(passage.choice.effects).length === 0, "c3_s02a_next 不应带数值");
  expect(passage.choice.next === "c3_s02b", "c3_s02a_next 没有进入 c3_s02b");
  const state = freshState(c3, "c3_s02a", { values: { EVD: 20, TRU: 25, EXP: 0, SLF: 17 } });
  const before = { ...state.vals };
  E.apply(state, passage.choice, c3);
  expect(state.scene === "c3_s02b", `过场实际进入 ${state.scene}`);
  expect(JSON.stringify(state.vals) === JSON.stringify(before), "无数值过场改变了数值");
  const scene = getScene(c3, "c3_s02b");
  expect(scene.bg === "scene_memory_gap_v1", `c3_s02b 背景应为 scene_memory_gap_v1，实际 ${scene.bg}`);
  expect(E.sceneText(scene, state, c3).includes("记录结束 · 04:39"), "c3_s02b 正文缺少记录结束时间");
  expect((scene.choices || []).some(choice => choice.id === "c3_s02a_override"), "v2 的倒回看选项不在 c3_s02b");
  return "过场数值不变并进入 scene_memory_gap_v1 的 c3_s02b；正文显示 04:39";
});

check("c3_s02a_next 后在 c3_s02b 倒回看设置 trace_override", () => {
  const { choice } = getChoice(c3, "c3_s02b", "c3_s02a_override");
  const state = freshState(c3, "c3_s02b");
  E.apply(state, choice, c3);
  expect(state.flags.includes("trace_override"), "倒回看没有写入 trace_override");
  expect(state.scene === "c3_s03a", "倒回看没有从 c3_s02b 进入 c3_s03a");
  return "v2 实际场景 c3_s02b 的倒回看已写入 trace_override";
});

check("c3_s04a_call 设置 trace_pullback，保密信件命中额外回放句", () => {
  const { scene, choice } = getChoice(c3, "c3_s04a", "c3_s04a_call");
  const state = freshState(c3, scene.id, { echoes: { c2_letter: "kept_secret" } });
  E.apply(state, choice, c3);
  expect(state.flags.includes("trace_pullback"), "拨号没有写入 trace_pullback");
  const result = E.choiceResult(choice, state, c3);
  expect(result.includes("你替那个人把信关上了"), "kept_secret 没有命中额外信件文案");
  expect(result.includes("对不起，是我站太近了"), "kept_secret 路线没有保留唐棠的道歉");
  const base = E.choiceResult(choice, freshState(c3, scene.id, { echoes: { c2_letter: "unread" } }), c3);
  expect(!base.includes("你替那个人把信关上了"), "额外信件文案泄漏到其他信件路线");
  const copied = E.choiceResult(choice, freshState(c3, scene.id, { echoes: { c2_letter: "copied" } }), c3);
  expect(copied.includes("你手里存着那封信的副本"), "copied 路线没有命中副本专属道歉/回忆句");
  return "trace_pullback 已写入；kept_secret 与 copied 分别命中专属句";
});

check("拨号与不拨号路线 EVD 增量分别精确为 25 和 18", () => {
  const common = { values: { EVD: 20, TRU: 55, EXP: 0, SLF: 10 }, echoes: { c1_mira: "asked" } };
  const called = runC3Route({ ...common, route: [
    "c3_s00a_listen", "c3_s01a_continue", "c3_s02a_skip", "c3_s03a_merge", "c3_s04a_call"
  ] });
  const notCalled = runC3Route({ ...common, route: [
    "c3_s00a_listen", "c3_s01a_continue", "c3_s02a_skip", "c3_s03a_merge", "c3_s04a_not_call"
  ] });
  expect(called.state.vals.EVD - common.values.EVD === 25, `拨号增量应为 25，实际 ${called.state.vals.EVD - common.values.EVD}`);
  expect(notCalled.state.vals.EVD - common.values.EVD === 18, `不拨号增量应为 18，实际 ${notCalled.state.vals.EVD - common.values.EVD}`);
  expect((c3.bonuses || []).some(item => item.id === "b_c3_not_called"), "缺少 b_c3_not_called");
  expect(notCalled.state.bonuses.includes("b_c3_not_called"), "不拨号奖励没有结算");
  expect(!called.state.bonuses.includes("b_c3_not_called"), "拨号路线错误触发不拨号奖励");
  return "b_c3_not_called 生效；不拨号 +18、拨号 +25";
});

check("第三章可见文本不含禁用措辞，‘两个我’正文带手套回指", () => {
  const two = (c3.endings || []).find(ending => ending.id === "C3_E_TWO");
  expect(two && two.text.includes("在对讲屏前，你对着一只手套猜过一次自己是谁"), "两个我结局正文缺少手套回指");
  const blocked = "像是被人放进来的";
  const visit = value => {
    if (typeof value === "string") expect(!value.includes(blocked), `第三章可见/序列化文本含禁用措辞：${value}`);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  visit({ scenes: c3.scenes, endings: c3.endings });
  return "禁用措辞未进入第三章数据；TWO 正文含对讲屏手套句";
});

check("C3_E_BROKEN 可进入且可避开", () => {
  const entered = runC3Route({ echoes: { c1_mira: "forced" } });
  const avoided = runC3Route({ echoes: { c1_mira: "asked" }, route: [
    "c3_s00a_listen", "c3_s01a_continue", "c3_s02a_skip", "c3_s03a_merge", "c3_s04a_not_call"
  ] });
  expect(entered.ending && entered.ending.id === "C3_E_BROKEN", "forced 路线没有进入 BROKEN");
  expect(avoided.ending && avoided.ending.id !== "C3_E_BROKEN", "非 forced 路线无法避开 BROKEN");
  return "forced 可进；asked 可避开";
});

check("C3_E_PULL 的 EVD>=45 门槛可进入且可避开", () => {
  const route = ["c3_s00a_listen", "c3_s01a_continue", "c3_s02a_skip", "c3_s03a_merge", "c3_s04a_call"];
  const entered = runC3Route({ values: { EVD: 20, SLF: 0 }, echoes: { c1_mira: "asked" }, route });
  const avoided = runC3Route({ values: { EVD: 19, SLF: 0 }, echoes: { c1_mira: "asked" }, route });
  expect(entered.state.vals.EVD === 45 && entered.ending && entered.ending.id === "C3_E_PULL", `EVD=20 应到 45 并进入 PULL，实际 ${entered.state.vals.EVD}/${entered.ending && entered.ending.id}`);
  expect(avoided.state.vals.EVD === 44 && avoided.ending && avoided.ending.id !== "C3_E_PULL", `EVD=19 应到 44 并避开 PULL，实际 ${avoided.state.vals.EVD}/${avoided.ending && avoided.ending.id}`);
  return "入章 EVD=20 得 45 可进；19 得 44 可避开";
});

check("C3_E_TWO 的 SLF>=40 与 c2_glove_guess_self 可进入且可避开", () => {
  const route = ["c3_s00a_why_me", "c3_s01a_continue", "c3_s02a_skip", "c3_s03a_isolate", "c3_s04a_not_call"];
  const common = { values: { EVD: 0, SLF: 20 }, echoes: { c1_mira: "asked" } };
  const entered = runC3Route({ ...common, flags: ["c2_glove_guess_self"], route });
  const noFlag = runC3Route({ ...common, flags: [], route });
  const below = runC3Route({ ...common, values: { EVD: 0, SLF: 19 }, flags: ["c2_glove_guess_self"], route });
  expect(entered.state.vals.SLF === 40 && entered.ending && entered.ending.id === "C3_E_TWO", `SLF=40 且有 flag 应进 TWO，实际 ${entered.state.vals.SLF}/${entered.ending && entered.ending.id}`);
  expect(noFlag.ending && noFlag.ending.id !== "C3_E_TWO", "缺少 c2_glove_guess_self 仍进入 TWO");
  expect(below.state.vals.SLF === 39 && below.ending && below.ending.id !== "C3_E_TWO", "SLF=39 未能避开 TWO");
  return "SLF=40 且有跨章 flag 可进；无 flag 或 SLF=39 可避开";
});

check("C3_E_VOICE 可进入且可由隔离路线避开", () => {
  const entered = runC3Route({ values: { EVD: 0, SLF: 0 }, echoes: { c1_mira: "asked" }, route: [
    "c3_s00a_listen", "c3_s01a_continue", "c3_s02a_skip", "c3_s03a_merge", "c3_s04a_not_call"
  ] });
  const avoided = runC3Route({ values: { EVD: 0, SLF: 0 }, echoes: { c1_mira: "asked" }, route: [
    "c3_s00a_listen", "c3_s01a_continue", "c3_s02a_skip", "c3_s03a_isolate", "c3_s04a_not_call"
  ] });
  expect(entered.ending && entered.ending.id === "C3_E_VOICE", "merge 路线没有进入 VOICE");
  expect(avoided.ending && avoided.ending.id !== "C3_E_VOICE", "isolate 路线无法避开 VOICE");
  return "merge 可进；isolate 可避开";
});

check("C3_E_STOP 可进入且可由合并路线避开", () => {
  const entered = runC3Route({ values: { EVD: 0, SLF: 0 }, echoes: { c1_mira: "asked" } });
  const avoided = runC3Route({ values: { EVD: 0, SLF: 0 }, echoes: { c1_mira: "asked" }, route: [
    "c3_s00a_listen", "c3_s01a_continue", "c3_s02a_skip", "c3_s03a_merge", "c3_s04a_not_call"
  ] });
  expect(entered.ending && entered.ending.id === "C3_E_STOP", "低 SLF 隔离路线没有进入 STOP");
  expect(avoided.ending && avoided.ending.id !== "C3_E_STOP", "merge 路线无法避开 STOP");
  return "低 SLF isolate 可进；merge 可避开";
});

check("遍历第三章全部选择路线并打印五个结局比例", () => {
  const endingIds = (c3.endings || []).map(ending => ending.id);
  const counts = Object.fromEntries(endingIds.map(id => [id, 0]));
  let total = 0;
  const scenes = sceneTable(c3);
  const incomingProfiles = [];
  for (const mira of ["asked", "forced"]) for (const evd of [19, 20])
    for (const slf of [19, 20]) for (const hasGloveFlag of [false, true]) {
      incomingProfiles.push({
        values: { EVD: evd, TRU: 55, EXP: 0, SLF: slf },
        flags: hasGloveFlag ? ["c2_glove_guess_self"] : [],
        echoes: { ...importedDefaults(c3), c1_mira: mira }
      });
    }
  function walk(state) {
    const scene = scenes[state.scene];
    if (!scene || !(scene.choices || []).length) {
      const ending = E.ending(c3, state);
      expect(ending && counts[ending.id] !== undefined, `路线未到达已登记结局: ${state.scene}`);
      counts[ending.id]++;
      total++;
      return;
    }
    for (const choice of E.visibleChoices(scene, state, c3)) {
      const next = E.clone(state);
      E.apply(next, choice, c3);
      walk(next);
    }
  }
  for (const profile of incomingProfiles) {
    const state = freshState(c3, c3.entry, profile);
    walk(state);
  }
  const routeCount = 3 * 2 * 1 * 2 * 2 * 2; // c3_s02a_next 是一条固定过场路线。
  expect(total === incomingProfiles.length * routeCount, `完整路线数错误：${total}`);
  console.log(`C3 结局比例（${incomingProfiles.length} 种阈值边界入章状态 × ${routeCount} 条选项路线 = ${total} 次）：`);
  for (const id of endingIds) console.log(`  ${id}: ${counts[id]}/${total} (${(100 * counts[id] / total).toFixed(2)}%)`);
  expect(endingIds.every(id => counts[id] > 0), "比例遍历未覆盖全部五个结局");
  return `${total} 次路线执行，覆盖 ${endingIds.length} 个结局`;
});

if (failures.length) {
  console.error(`\n失败 ${failures.length} 项`);
  process.exitCode = 1;
} else {
  console.log("\n全部路径与引擎用例通过。");
}
