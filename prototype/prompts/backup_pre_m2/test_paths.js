// node test_paths.js → state-deduplicated branch report (also writes test-report.txt)
const fs = require("fs"), path = require("path"), E = require("./engine.js");
const D = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const SCN = Object.fromEntries(D.scenes.map(s => [s.id, s]));
const out = [], P = s => out.push(s);
let fail = 0;
const MAX_STATES = 200000;
const ends = [], dead = new Set(), refd = new Set([D.scenes[0].id]);
const displayedPortraits = new Set();
const sceneStates = new Map(D.scenes.map(s => [s.id, 0]));
const locks = new Map();
const seen = new Map(), queue = [];
let truncated = false;
let minuteRange = [Infinity, -Infinity];

function sortedObject(obj) {
  return Object.fromEntries(Object.keys(obj || {}).sort().map(k => [k, obj[k]]));
}
function stateKey(st) {
  return JSON.stringify([
    st.scene,
    [...(st.flags || [])].sort(),
    sortedObject(st.vals),
    [...(st.bonuses || [])].sort()
  ]);
}
function enqueue(st, trail) {
  minuteRange[0] = Math.min(minuteRange[0], st.mins);
  minuteRange[1] = Math.max(minuteRange[1], st.mins);
  const key = stateKey(st);
  if (seen.has(key)) return seen.get(key);
  if (seen.size >= MAX_STATES) {
    truncated = true;
    return null;
  }
  const node = { key, st, trail, edges: [], outcome: false };
  seen.set(key, node);
  queue.push(node);
  return node;
}

enqueue(E.initState(D), []);
for (let cursor = 0; cursor < queue.length; cursor++) {
  const node = queue[cursor], { st, trail } = node;
  minuteRange[0] = Math.min(minuteRange[0], st.mins);
  minuteRange[1] = Math.max(minuteRange[1], st.mins);
  const s = SCN[st.scene];
  if (!s) {
    const label = `${trail.at(-1) || "开场"} → next "${st.scene}"（场景不存在）`;
    dead.add(label);
    node.outcome = true;
    ends.push({ st, trail, e: null, unfinished: true, missing: true, nodeKey: node.key });
    continue;
  }
  sceneStates.set(s.id, (sceneStates.get(s.id) || 0) + 1);
  const displayedPortrait = E.resolvePortrait(D, s, st);
  if (displayedPortrait) displayedPortraits.add(displayedPortrait);
  for (const c of s.choices || []) if (c.next) refd.add(c.next);

  if (!(s.choices || []).length) {
    const e = E.ending(D, st);
    node.outcome = true;
    ends.push({ st, trail, e, unfinished: !e, nodeKey: node.key });
    if (!e) dead.add(`${s.id} 无选项且无结局`);
    continue;
  }

  const choices = E.visibleChoices(s, st);
  if (!choices.length) {
    node.outcome = true;
    const item = locks.get(s.id) || { count: 0, flags: [...(st.flags || [])].sort() };
    item.count++;
    locks.set(s.id, item);
    continue;
  }
  for (const c of choices) {
    const next = E.clone(st);
    E.apply(next, c, D);
    const child = enqueue(next, [...trail, c.id]);
    if (child) node.edges.push({ to: child.key, choice: c.id });
  }
}

// Count distinct choice paths on the deduplicated state graph. Parallel choice edges remain separate.
const nodes = [...seen.values()], indegree = new Map(nodes.map(n => [n.key, 0]));
for (const n of nodes) for (const edge of n.edges) indegree.set(edge.to, indegree.get(edge.to) + 1);
const topoQueue = nodes.filter(n => indegree.get(n.key) === 0).map(n => n.key), ways = new Map(nodes.map(n => [n.key, 0n]));
if (topoQueue.length) ways.set(topoQueue[0], 1n);
const topo = [];
for (let cursor = 0; cursor < topoQueue.length; cursor++) {
  const key = topoQueue[cursor], n = seen.get(key);
  topo.push(key);
  for (const edge of n.edges) {
    ways.set(edge.to, ways.get(edge.to) + ways.get(key));
    indegree.set(edge.to, indegree.get(edge.to) - 1);
    if (indegree.get(edge.to) === 0) topoQueue.push(edge.to);
  }
}
const pathCycle = topo.length !== nodes.length;
let pathTotal = pathCycle
  ? BigInt(nodes.filter(n => n.outcome).length)
  : nodes.filter(n => n.outcome).reduce((sum, n) => sum + ways.get(n.key), 0n);
const pathTruncated = pathTotal > BigInt(MAX_STATES);
if (pathTruncated) pathTotal = BigInt(MAX_STATES);
const outcomePaths = new Map(nodes.filter(n => n.outcome).map(n => [n.key, pathCycle ? 1n : ways.get(n.key)]));

P(`数据源: ${(D._sources || []).join(", ")}`);
P(`场景 ${D.scenes.length} · 唯一状态 ${seen.size}${truncated ? "（已截断）" : ""} · 终点路径 ${pathTotal}${pathTruncated || truncated ? "（已截断）" : pathCycle ? "（状态图有环，按终点状态计）" : ""} · endings ${(D.endings || []).length} · bonuses ${(D.bonuses || []).length} · self_endings ${(D.self_endings || []).length}`);

// Duplicate ids
const dup = a => a.filter((x, i) => a.indexOf(x) !== i);
const d1 = dup(D.scenes.map(s => s.id));
const d2 = dup(D.scenes.flatMap(s => (s.choices || []).map(c => c.id)));
if (d1.length || d2.length) P(`\n[重复 id] 场景:${d1} 选项:${d2}`);

P(`\n[死路] ${dead.size}`);
dead.forEach(x => P("  - " + x));
P(`\n[未被引用的场景] ${D.scenes.filter(s => !refd.has(s.id)).map(s => s.id).join(", ") || "无"}`);

// Conditional deadlocks and fallback checks
P(`\n[卡死] ${[...locks.values()].reduce((n, x) => n + x.count, 0)}`);
for (const [id, item] of locks) P(`  - 卡死: ${id} · ${item.count} 次 · 示例 flags=${JSON.stringify(item.flags)}`);
const noFallback = D.scenes.filter(s => (s.choices || []).length && !(s.choices || []).some(c =>
  !Object.prototype.hasOwnProperty.call(c, "when") &&
  !Object.prototype.hasOwnProperty.call(c, "requires") &&
  !Object.prototype.hasOwnProperty.call(c, "hide_if")
));
P(`\n[缺兜底选项] ${noFallback.length}`);
noFallback.forEach(s => P(`  - 缺兜底选项: ${s.id}`));
P(`\n[场景可达状态数 / 卡死次数]`);
for (const s of D.scenes) P(`  - ${s.id}: ${sceneStates.get(s.id) || 0} / ${(locks.get(s.id) || { count: 0 }).count}`);

// Images
const need = new Set();
D.scenes.forEach(s => {
  if (s.bg) need.add(s.bg);
  (s.choices || []).forEach(c => need.add("thumb:" + c.id));
});
(displayedPortraits).forEach(portrait => need.add(portrait));
(D.portrait_overrides || []).forEach(override => {
  if (override.to) need.add(override.to);
});
(D.endings || []).filter(e => !e.same_as).forEach(e => need.add("ending:" + e.id));
const miss = [...need].filter(k => !D.images[k]);
P(`\n[缺失图片] ${miss.length}/${need.size}（可达状态实际显示立绘 ${displayedPortraits.size} 个，另检查所有替换目标）`);
P("  " + miss.join(", "));
P(`  已找到: ${Object.entries(D.images || {}).map(([k, v]) => k + "→" + v).join("; ")}`);

P(`\n[立绘替换] ${ (D.portrait_overrides || []).length } 条`);
(D.portrait_overrides || []).forEach((override, index) => {
  const source = (D._portrait_override_sources || [])[index] || "来源未知";
  P(`  - ${source}: ${JSON.stringify(override.when)} · ${override.from} → ${override.to}`);
});
(D._portrait_override_skipped || []).forEach(source => {
  P(`  - ${source}: 跳过重复项（story 已有相同 from+to）`);
});

// Ending and reachable-state value ranges
function rangesFor(rows) {
  const ranges = {};
  for (const { st } of rows) {
    for (const [k, v] of Object.entries({ ...st.vals, 分钟: st.mins })) {
      ranges[k] = ranges[k] || [Infinity, -Infinity];
      ranges[k][0] = Math.min(ranges[k][0], v);
      ranges[k][1] = Math.max(ranges[k][1], v);
    }
  }
  return ranges;
}
const r = rangesFor(ends);
P(`\n[路径终点数值范围]`);
for (const [k, [a, b]] of Object.entries(r)) P(`  ${k}: ${a} ~ ${b}`);
if (r.分钟) P(`  终点时钟: ${E.hm(D.clock_start, r.分钟[0])} ~ ${E.hm(D.clock_start, r.分钟[1])}`);
if (minuteRange[0] !== Infinity) P(`  全部可达状态分钟范围: ${minuteRange[0]} ~ ${minuteRange[1]}（${E.hm(D.clock_start, minuteRange[0])} ~ ${E.hm(D.clock_start, minuteRange[1])}）`);
const dist = {};
ends.forEach(x => {
  const k = x.missing ? "(next 未写，场景不存在)" : x.unfinished ? "(无结局)" : x.e.id;
  const count = Number(outcomePaths.get(x.nodeKey) || 0n);
  dist[k] = (dist[k] || 0) + count;
});
P(`\n[当前路径结局分布] ${JSON.stringify(dist)}`);

// Find flag references in expression strings and {all}/{any} objects.
function collectConditionFlags(value, found) {
  if (typeof value === "string") {
    for (const m of value.matchAll(/flag:([A-Za-z_][A-Za-z0-9_.=-]*)/g)) found.add(m[1]);
    for (const m of value.matchAll(/\b([A-Za-z_][A-Za-z0-9_.-]*)\s*==\s*([A-Za-z_][A-Za-z0-9_.-]*)/g)) {
      if (!Object.prototype.hasOwnProperty.call(D.values || {}, m[1])) found.add(m[1] + "=" + m[2]);
    }
    for (const m of value.matchAll(/\b([A-Za-z_][A-Za-z0-9_.-]*)\s+in\s*\[([^\]]*)\]/g)) {
      if (!Object.prototype.hasOwnProperty.call(D.values || {}, m[1])) {
        for (const item of m[2].matchAll(/[A-Za-z_][A-Za-z0-9_.-]*/g)) found.add(m[1] + "=" + item[0]);
      }
    }
  } else if (Array.isArray(value)) value.forEach(v => collectConditionFlags(v, found));
  else if (value && typeof value === "object") Object.values(value).forEach(v => collectConditionFlags(v, found));
}
const setF = new Set(D.scenes.flatMap(s => (s.choices || []).flatMap(c => c.flags_set || [])));
const refF = new Map();
const portraitRefF = new Map();
const addRefs = (source, condition) => {
  const found = new Set();
  collectConditionFlags(condition, found);
  for (const flag of found) {
    if (!refF.has(flag)) refF.set(flag, new Set());
    refF.get(flag).add(source);
  }
};
D.scenes.forEach(s => (s.choices || []).forEach(c => {
  for (const field of ["when", "requires", "hide_if"]) {
    if (!Object.prototype.hasOwnProperty.call(c, field)) continue;
    if (field === "when") addRefs(`${s.id}/${c.id}.when`, c.when);
    else {
      const list = Array.isArray(c[field]) ? c[field] : [c[field]];
      for (const flag of list) if (typeof flag === "string") {
        if (!refF.has(flag)) refF.set(flag, new Set());
        refF.get(flag).add(`${s.id}/${c.id}.${field}`);
      }
    }
  }
}));
(D.endings || []).forEach(e => { addRefs(e.id, e.when); addRefs(e.id + ".variant", e.variant); });
(D.bonuses || []).forEach(b => addRefs(b.id, b.when));
(D.self_endings || []).forEach(s => addRefs(s.id, s.when));
(D.portrait_overrides || []).forEach((override, index) => {
  const source = (D._portrait_override_sources || [])[index] || "来源未知";
  const found = new Set();
  collectConditionFlags(override.when, found);
  for (const flag of found) {
    if (!portraitRefF.has(flag)) portraitRefF.set(flag, new Set());
    portraitRefF.get(flag).add(`portrait_overrides[${index}] (${source})`);
  }
});
(D.portrait_overrides || []).forEach((override, index) => {
  const source = (D._portrait_override_sources || [])[index] || "来源未知";
  addRefs(`portrait_overrides[${index}] (${source})`, override.when);
});
const unset = [...refF].filter(([flag]) => !setF.has(flag));
const portraitUnset = [...portraitRefF].filter(([flag]) => !setF.has(flag));
P(`\n[立绘替换条件引用但无人设置的 flag] ${portraitUnset.length}`);
portraitUnset.forEach(([flag, sources]) => P(`  - ${flag} ← ${[...sources].join(", ")}`));
P(`\n[条件引用但数据中无人设置的 flag] ${unset.length}/${refF.size}`);
unset.forEach(([flag, sources]) => P(`  - ${flag} ← ${[...sources].join(", ")}`));

// Choice balance checks
const chapterOf = id => (String(id).match(/^c\d+/) || ["全数据"])[0];
const keyCounts = new Map();
const largeEffects = [];
for (const s of D.scenes) for (const c of s.choices || []) {
  if (c.key === true) keyCounts.set(chapterOf(s.id), (keyCounts.get(chapterOf(s.id)) || 0) + 1);
  if (!c.key) for (const [value, amount] of Object.entries(c.effects || {})) {
    if (Number(amount) < -10 || Number(amount) > 10) largeEffects.push(`${s.id}/${c.id} ${value}:${amount}`);
  }
}
P(`\n[抉择平衡报警]`);
for (const [chapter, count] of keyCounts) if (count > 2) P(`  - ${chapter}: key:true ${count} 个（超过 2）`);
largeEffects.forEach(x => P(`  - 普通抉择单项 effects 超过 ±10: ${x}`));
if (!keyCounts.size && !largeEffects.length) P("  无");

// Static ending reachability (sampled) and actual traversal reachability.
const allF = [...refF.keys()];
function sample() {
  const rows = [];
  const ev = [0, 30, 50, 60, 65, 70, 85, 100], sv = [0, 34, 35, 64, 65, 100];
  for (let i = 0; i < 20000; i++) rows.push({
    vals: { EVD: ev[i % 8], TRU: ev[(i >> 3) % 8], EXP: ev[(i >> 6) % 8], SLF: sv[(i >> 9) % 6] },
    flags: allF.filter(() => Math.random() < 0.3)
  });
  return rows;
}
const sampled = sample(), staticHit = {};
for (const st of sampled) {
  const e = E.ending(D, st);
  if (e) staticHit[e.id] = 1;
}
const dynHit = new Set(ends.filter(x => x.e).map(x => x.e.id));
P(`\n[结局可达性]`);
for (const e of D.endings || []) {
  const deps = [...refF.keys()].filter(flag => refF.get(flag).has(e.id) && !setF.has(flag));
  P(`  - ${e.id}: 理论${staticHit[e.id] ? "可达" : "不可达（被前序条件完全遮蔽）"} · 当前数据${dynHit.has(e.id) ? "已走到" : "未走到"}${deps.length ? " · 依赖未设置 flag: " + [...new Set(deps)].join(",") : ""}`);
}

// Engine self-checks for the parser, visibility rules, clamping and old features.
const T = { vals: { TRU: 3, EVD: 5 }, flags: ["x", "y", "cause=K1", "culprit=ZHOU"] };
const okExpr = E.evalWhen("TRU >= 3 && flag:x", T) && !E.evalWhen("TRU >= 4", T) && E.evalWhen("!flag:z", T) && E.evalWhen("true", T);
const reqScene = { choices: [{ id: "r", requires: ["x", "y"] }] };
const okRequires = E.visibleChoices(reqScene, T).length === 1;
const hideScene = { choices: [{ id: "h", hide_if: "x" }] };
const okHide = E.visibleChoices(hideScene, T).length === 0 && E.visibleChoices(hideScene, { flags: [] }).length === 1;
const comboScene = { choices: [
  { id: "all-three", when: "EVD >= 2", requires: ["x"], hide_if: ["blocked"] },
  { id: "requires-is-literal", requires: "flag:x && flag:y" }
] };
const comboVisible = E.visibleChoices(comboScene, T).map(c => c.id);
const exactExprFlag = E.visibleChoices({ choices: [{ id: "literal", requires: "flag:x && flag:y" }] }, { flags: ["flag:x && flag:y"] }).length === 1;
const keyValues = E.evalWhen("cause==K1", T) && !E.evalWhen("cause==K2", T) && E.evalWhen("culprit in [ZHOU,SYSTEM]", T);
const objects = E.evalWhen({ all: ["cause==K1", { any: ["culprit in [ZHOU,SYSTEM]", "flag:nope"] }] }, T) &&
  !E.evalWhen({ any: ["cause==K2", { all: ["flag:x", "flag:nope"] }] }, T);
const boundedD = { values: { EVD: { init: 95, min: 0, max: 100 }, TRU: 30 }, scenes: [{ id: "a" }], bonuses: [] };
const bounded = E.initState(boundedD);
E.apply(bounded, { id: "up", label: "up", effects: { EVD: 20 }, next: "b" }, boundedD);
E.apply(bounded, { id: "down", label: "down", effects: { EVD: -200 }, next: "c" }, boundedD);
const okClamp = E.initState(boundedD).vals.EVD === 95 && bounded.vals.EVD === 0;
const bd = { bonuses: [{ id: "b", when: "flag:a && flag:b", effects: { EVD: 10 }, once: true }], values: {} };
const bs = { vals: { EVD: 0 }, flags: ["a", "b"], log: [], bonuses: [], mins: 0 };
E.checkBonuses(bd, bs); E.checkBonuses(bd, bs);
const okBonus = bs.vals.EVD === 10 && bs.log.length === 1;
const vD = { endings: [{ id: "X", when: "true", variant: "TRU >= 60", review: "……" }], self_endings: [{ id: "S", when: "SLF<35" }] };
const ve = E.ending(vD, { vals: { TRU: 70, SLF: 0 }, flags: [] });
const okVariant = ve.high === true && ve.review === null && ve.selves[0] === "S";
const fb = E.ending({ endings: [{ id: "A", when: "false", review: "a" }, { id: "F", when: "true", same_as: "A" }] }, { vals: {}, flags: [] });
const okFallback = fb.id === "F" && fb.shown === "A";
const portraitScene = { portrait: "mira_lv1" };
const portraitD = { portrait_overrides: [{ when: "flag:forced", from: "mira_lv1", to: "mira_broken" }] };
const portraitHit = E.resolvePortrait(portraitD, portraitScene, { flags: ["forced"] }) === "mira_broken";
const portraitMiss = E.resolvePortrait(portraitD, portraitScene, { flags: [] }) === "mira_lv1";
const portraitFromMismatch = E.resolvePortrait({ portrait_overrides: [{ when: "true", from: "other", to: "mira_broken" }] }, portraitScene, T) === "mira_lv1";
const okPortrait = portraitHit && portraitMiss && portraitFromMismatch;
let warnings = 0;
const oldWarn = console.warn;
console.warn = () => { warnings++; };
const bad1 = E.evalWhen("EVD >>> 2", T), bad2 = E.evalWhen("EVD >>> 2", T);
console.warn = oldWarn;
const engineSource = fs.readFileSync(path.join(__dirname, "engine.js"), "utf8");
const noDynamicCode = !/\bFunction\s*\(/.test(engineSource) && !/\beval\s*\(/.test(engineSource);
const okVisibility = comboVisible.length === 1 && comboVisible[0] === "all-three" && exactExprFlag &&
  E.visibleChoices(comboScene, { vals: T.vals, flags: ["x", "y", "blocked"] }).length === 0;
P(`\n[引擎自检] 表达式${okExpr ? "✓" : "✗"} requires${okRequires ? "✓" : "✗"} hide_if${okHide ? "✓" : "✗"} 三条件组合/字面 requires${okVisibility ? "✓" : "✗"} 键值 flag/in${keyValues ? "✓" : "✗"} all/any${objects ? "✓" : "✗"} min/max${okClamp ? "✓" : "✗"} parse-warn-once${!bad1 && !bad2 && warnings === 1 ? "✓" : "✗"} 无动态执行${noDynamicCode ? "✓" : "✗"} bonus-once${okBonus ? "✓" : "✗"} variant/占位/自我结局${okVariant ? "✓" : "✗"} 兜底same_as${okFallback ? "✓" : "✗"} resolvePortrait 命中/未命中/from 不匹配${okPortrait ? "✓" : "✗"}`);
if (!(okExpr && okRequires && okHide && okVisibility && keyValues && objects && okClamp && !bad1 && !bad2 && warnings === 1 && noDynamicCode && okBonus && okVariant && okFallback && okPortrait)) fail = 1;

// Three true-ending route cases run once every referenced flag has a setter.
const ROUTES = {
  "甲 现场派": ["c1_s01a_mira", "c1_s01b_chat"],
  "乙 日志派": ["c1_s00a_answer", "c1_s01a_mira"],
  "丙 人心派": ["c1_s00a_answer", "c1_s01a_mira", "c1_s01b_chat"]
};
const trueEnding = (D.endings || []).find(e => e.id === "E_ECHO_TRUE");
const trueFlags = new Set();
if (trueEnding) collectConditionFlags(trueEnding.when, trueFlags);
const neededTrueFlags = [...new Set(["bus_log", "zhou_heard", "zhou_letter", ...trueFlags])];
const missingTrueFlags = neededTrueFlags.filter(f => !setF.has(f));
const ready = !!trueEnding && missingTrueFlags.length === 0;
P(`\n[真结局用例 E_ECHO_TRUE] ${ready ? "启用" : "SKIP；缺少 flags: " + (missingTrueFlags.join(", ") || "E_ECHO_TRUE 结局定义")}`);
for (const [name, prefix] of Object.entries(ROUTES)) {
  if (!ready) {
    P(`  - ${name}: SKIP（开场前缀 ${prefix.join(", ")}）`);
    continue;
  }
  const hit = ends.find(x => prefix.every(id => x.trail.includes(id)) && x.e && x.e.id === "E_ECHO_TRUE");
  P(`  - ${name}: ${hit ? "PASS" : "FAIL"}`);
  if (!hit) fail = 1;
}
const preview = ends.map(x => E.ending(D, x.st)).filter(Boolean), pd = {};
preview.forEach(e => { const k = e.id + "+" + e.selves.join("+"); pd[k] = (pd[k] || 0) + 1; });
P(`[假如此刻进入终局判定] ${JSON.stringify(pd)}`);

P(`\n[路径明细（前 30）]`);
ends.slice(0, 30).forEach(({ st, trail, e }) => P(`  ${trail.join(" > ")} | ${JSON.stringify(st.vals)} ${st.mins}min | ${e ? e.id + (e.selves.length ? "+" + e.selves.join("+") : "") : "本段结束(next 未写)"}`));

const txt = out.join("\n");
console.log(txt);
fs.writeFileSync(path.join(__dirname, "test-report.txt"), txt + "\n");
process.exitCode = fail;
