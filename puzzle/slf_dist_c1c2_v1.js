#!/usr/bin/env node
"use strict";

// Enumerate deduplicated reachable end states for c1 -> c2 with app-equivalent
// value carry, echo/flag exports, chapter-start adjustments, and chapter limits.
const fs = require("fs");
const path = require("path");
const E = require("../prototype/engine_v3.js");
const D = JSON.parse(fs.readFileSync(path.join(__dirname, "../prototype/data_v4.json"), "utf8"));

const MAX_STATES = 200000;
const chapters = Object.fromEntries((D.chapters || []).map(chapter => [chapter.id, chapter]));
const c1 = chapters.c1;
const c2 = chapters.c2;
if (!c1 || !c2) throw new Error("data_v4.json must contain c1 and c2");

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
function chapterMinutes(chapter) {
  const start = (chapter.clock && chapter.clock.start || "00:00").split(":").map(Number);
  const end = (chapter.clock && chapter.clock.end || "00:00").split(":").map(Number);
  return end[0] * 60 + end[1] - start[0] * 60 - start[1];
}
function sceneTable(chapter) {
  return Object.fromEntries((chapter.scenes || []).map(scene => [scene.id, scene]));
}
function startState(chapter, input) {
  const state = E.initState(chapter, input);
  state.scene = chapter.entry || state.scene;
  return state;
}
function cloneForTransition(state) {
  return {
    scene: state.scene,
    mins: state.mins,
    flags: [...(state.flags || [])],
    vals: Object.assign({}, state.vals || {}),
    echoes: Object.assign({}, state.echoes || {}),
    bonuses: [...(state.bonuses || [])],
    log: [], keys: [], curve: []
  };
}
function enumerate(chapter, starts, terminalMapper = state => E.clone(state), keyer = stateKey) {
  const scenes = sceneTable(chapter);
  const states = new Set();
  const terminals = [];
  const stack = starts.slice();
  let appliedEdges = 0;

  while (stack.length) {
    const state = stack.pop();
    const key = keyer(state);
    if (states.has(key)) continue;
    if (states.size >= MAX_STATES) {
      throw new Error(`${chapter.id} enumeration exceeded MAX_STATES=${MAX_STATES}`);
    }
    states.add(key);
    const scene = scenes[state.scene];
    if (!scene || !(scene.choices || []).length) {
      const settled = E.clone(state);
      E.deriveEchoes(chapter, settled);
      terminals.push(terminalMapper(settled));
      continue;
    }
    for (const choice of E.visibleChoices(scene, state, chapter)) {
      const next = cloneForTransition(state);
      E.apply(next, choice, chapter);
      if (chapter.clock && chapter.clock.closing_scene && scene.id !== chapter.clock.closing_scene &&
          next.mins >= chapterMinutes(chapter)) next.scene = chapter.clock.closing_scene;
      stack.push(next);
      appliedEdges++;
    }
  }
  return { stateCount: states.size, terminals, appliedEdges };
}
function chapterOutputs(chapter, terminal) {
  const exports = chapter.exports || {};
  const echoes = {};
  for (const id of exports.echoes || []) {
    if (Object.prototype.hasOwnProperty.call(terminal.echoes || {}, id)) echoes[id] = terminal.echoes[id];
  }
  const flags = (exports.flags || []).filter(flag => (terminal.flags || []).includes(flag));
  return { values: E.clone(terminal.vals), echoes, flags };
}
function percentile(sorted, p, total) {
  if (!total) return null;
  const position = (total - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const atRank = rank => {
    let cumulative = 0;
    for (const item of sorted) {
      cumulative += item.count;
      if (rank < cumulative) return item.value;
    }
    return sorted[sorted.length - 1].value;
  };
  const low = atRank(lower);
  if (lower === upper) return low;
  return low + (atRank(upper) - low) * (position - lower);
}
function fmt(value) {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}
function totalStates(profiles) {
  return profiles.reduce((sum, profile) => sum + profile.count, 0);
}
function stats(profiles, metric) {
  const frequencies = new Map();
  let total = 0;
  for (const profile of profiles) {
    const value = profile.row[metric];
    frequencies.set(value, (frequencies.get(value) || 0) + profile.count);
    total += profile.count;
  }
  const sorted = [...frequencies].map(([value, count]) => ({ value, count })).sort((a, b) => a.value - b.value);
  return [sorted[0].value, sorted[sorted.length - 1].value,
    ...[0.1, 0.25, 0.5, 0.75, 0.9].map(p => percentile(sorted, p, total))];
}
function statTable(profiles, label) {
  const columns = ["指标", "最小", "P10", "P25", "P50", "P75", "P90", "最大"];
  const lines = [`### ${label}（${totalStates(profiles).toLocaleString("en-US")} 个终态，${profiles.length.toLocaleString("en-US")} 种记录）`, "", `| ${columns.join(" | ")} |`, `| ${columns.map(() => "---:").join(" | ")} |`];
  for (const metric of ["SLF", "TRU", "EVD"]) {
    lines.push(`| ${metric} | ${stats(rows, metric).map(fmt).join(" | ")} |`);
  }
  return lines.join("\n");
}
function recordOf(state) {
  return {
    EVD: Number(state.vals.EVD),
    TRU: Number(state.vals.TRU),
    EXP: Number(state.vals.EXP),
    SLF: Number(state.vals.SLF),
    c1_mira: state.echoes.c1_mira,
    c2_glove_guess_self: (state.flags || []).includes("c2_glove_guess_self"),
    c2_took_glove: (state.flags || []).includes("c2_took_glove")
  };
}
function enumerateC2(chapter, starts) {
  const scenes = sceneTable(chapter);
  const profiles = new Map();
  const stack = [];
  let visitedPrefixes = 0;
  let appliedEdges = 0;
  let endStates = 0;
  const addTerminal = state => {
    const settled = cloneForTransition(state);
    E.deriveEchoes(chapter, settled);
    const row = recordOf(settled);
    const rowKey = JSON.stringify(row);
    const profile = profiles.get(rowKey);
    if (profile) profile.count++;
    else profiles.set(rowKey, { row, count: 1 });
    endStates++;
  };
  for (const start of starts) {
    stack.push(start);
    while (stack.length) {
      const state = stack.pop();
      visitedPrefixes++;
      const scene = scenes[state.scene];
      if (!scene || !(scene.choices || []).length) {
        addTerminal(state);
        continue;
      }
      // At the closing scene, sibling choices can converge after clamping
      // (for example SLF−5 at 0). Match the complete state-key dedup used above.
      if (scene.id === chapter.clock.closing_scene) {
        const siblingEnds = new Map();
        for (const choice of E.visibleChoices(scene, state, chapter)) {
          const next = cloneForTransition(state);
          E.apply(next, choice, chapter);
          if (chapter.clock && scene.id !== chapter.clock.closing_scene && next.mins >= chapterMinutes(chapter)) {
            next.scene = chapter.clock.closing_scene;
          }
          siblingEnds.set(stateKey(next), next);
          appliedEdges++;
        }
        for (const next of siblingEnds.values()) addTerminal(next);
        continue;
      }
      for (const choice of E.visibleChoices(scene, state, chapter)) {
        const next = cloneForTransition(state);
        E.apply(next, choice, chapter);
        if (chapter.clock && chapter.clock.closing_scene && next.mins >= chapterMinutes(chapter)) {
          next.scene = chapter.clock.closing_scene;
        }
        stack.push(next);
        appliedEdges++;
      }
    }
  }
  return { profiles: [...profiles.values()], endStates, visitedPrefixes, appliedEdges };
}

const c1Start = startState(c1, {
  values: E.carryValues({}, c1), echoes: importedDefaults(c1), flags: []
});
const c1Result = enumerate(c1, [c1Start]);
console.log(`Enumerated c1: ${c1Result.stateCount} states / ${c1Result.terminals.length} terminal states`);
const c2StartsByKey = new Map();
for (const terminal of c1Result.terminals) {
  const output = chapterOutputs(c1, terminal);
  const allowedFlags = new Set((c2.imports || {}).flags || []);
  const echoes = importedDefaults(c2);
  for (const id of (c2.imports || {}).echoes || []) {
    if (Object.prototype.hasOwnProperty.call(output.echoes, id)) echoes[id] = output.echoes[id];
  }
  const start = startState(c2, {
    values: E.carryValues(output.values, c2), echoes,
    flags: output.flags.filter(flag => allowedFlags.has(flag))
  });
  c2StartsByKey.set(stateKey(start), start);
}
const c2Starts = [...c2StartsByKey.values()];
const c2Result = enumerateC2(c2, c2Starts);
const rows = c2Result.profiles.sort((a, b) => a.row.EVD - b.row.EVD || a.row.TRU - b.row.TRU || a.row.SLF - b.row.SLF ||
  a.row.EXP - b.row.EXP || String(a.row.c1_mira).localeCompare(String(b.row.c1_mira)) ||
  Number(a.row.c2_glove_guess_self) - Number(b.row.c2_glove_guess_self) || Number(a.row.c2_took_glove) - Number(b.row.c2_took_glove));
const selfRows = rows.filter(profile => profile.row.c2_glove_guess_self);
const selfAndTookRows = rows.filter(profile => profile.row.c2_glove_guess_self && profile.row.c2_took_glove);
const report = [
  "# c1→c2 终态数值分布（v1）",
  "",
  "由 `node puzzle/slf_dist_c1c2_v1.js` 生成。第一章按 `test_paths_v3.js` 的完整状态键去重；第二章先对 app 实际得到的相同入章状态去重，再展开全部可见选项路径，并在收束场景按完整状态键合并同一父状态下收敛的终态。表内按终态数加权，按指定字段相同的记录聚合显示。每个终态记录 `EVD / TRU / EXP / SLF`、`c1_mira`、`c2_glove_guess_self`、`c2_took_glove`。第二章入章使用 `Engine.carryValues`（EVD/TRU/SLF 保持、EXP−20 且不低于 0），并按 app 的章节导出、导入规则传递回响和 flag。百分位采用线性插值（含端点，位置 `(n−1)p`）。",
  "",
  `- 第一章：${c1Result.terminals.length.toLocaleString("en-US")} 个去重终态；枚举 ${c1Result.stateCount.toLocaleString("en-US")} 个状态、${c1Result.appliedEdges.toLocaleString("en-US")} 条可见选项边。`,
  `- 第二章：${c2Result.endStates.toLocaleString("en-US")} 个终态、${rows.length.toLocaleString("en-US")} 种报告记录；去重入章状态 ${c2Starts.length.toLocaleString("en-US")} 个，展开 ${c2Result.visitedPrefixes.toLocaleString("en-US")} 个路径前缀、${c2Result.appliedEdges.toLocaleString("en-US")} 条可见选项边。`,
  `- \`c2_glove_guess_self\`：${totalStates(selfRows).toLocaleString("en-US")} 个终态、${selfRows.length.toLocaleString("en-US")} 种记录；其中同时有 \`c2_took_glove\`：${totalStates(selfAndTookRows).toLocaleString("en-US")} 个终态。`,
  "",
  statTable(rows, "全部状态"),
  "",
  statTable(selfRows, "`c2_glove_guess_self` 子集"),
  "",
  "备注：`c2_glove_guess_self` 当前路径必经捡手套选项；仍单独输出 `c2_took_glove` 以显式校验状态组合。",
  ""
].join("\n");
const outputPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, "slf_dist_c1c2_v1.md");
fs.writeFileSync(outputPath, report, "utf8");
console.log(`Wrote ${outputPath}`);
console.log(`c1 terminal states: ${c1Result.terminals.length}; c2 terminal states: ${c2Result.endStates}; self terminal states: ${totalStates(selfRows)}; self+took: ${totalStates(selfAndTookRows)}`);
