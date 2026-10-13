// State-deduplicated chapter path checks and engine self-checks.
"use strict";
const fs = require("fs");
const path = require("path");
const E0 = require("./engine.js");
const E = require("./engine_v2.js");
const D = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const out = [];
const P = line => out.push(String(line));
let fail = 0;
const MAX_STATES = 200000;
const natural = value => String(value).replace(/\d+/g, n => n.padStart(12, "0"));
const chapterById = Object.fromEntries((D.chapters || []).map(chapter => [chapter.id, chapter]));
const chapterOrder = (D.chapters || []).map(chapter => chapter.id);

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
function validConditionShape(value) {
  if (typeof value === "string" || typeof value === "boolean" || value === null) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(key => (key === "all" || key === "any") && Array.isArray(value[key]) &&
    value[key].every(item => typeof item === "string" || (item && typeof item === "object" && !Array.isArray(item))));
}
function validText(value) {
  return typeof value === "string" || (Array.isArray(value) && value.every(item => typeof item === "string"));
}
function validateMissedVariants(list) {
  return Array.isArray(list) && list.every(item => item && typeof item === "object" && !Array.isArray(item) &&
    Object.prototype.hasOwnProperty.call(item, "when") && validConditionShape(item.when) &&
    (Object.prototype.hasOwnProperty.call(item, "missed") ? validText(item.missed) : validText(item.text)));
}
function validateTextVariants(list, contentKey) {
  if (!Array.isArray(list)) return false;
  return list.every(item => item && typeof item === "object" && !Array.isArray(item) &&
    Object.prototype.hasOwnProperty.call(item, "when") && validConditionShape(item.when) &&
    Object.prototype.hasOwnProperty.call(item, contentKey) && validText(item[contentKey]));
}
function chapterMinutes(chapter) {
  const start = (chapter.clock.start || "00:00").split(":").map(Number);
  const end = (chapter.clock.end || "00:00").split(":").map(Number);
  return end[0] * 60 + end[1] - start[0] * 60 - start[1];
}
function enumerate(chapter) {
  const scenes = sceneTable(chapter);
  const startValues = E.carryValues({}, chapter);
  const start = E.initState(chapter, { values: startValues, echoes: importedDefaults(chapter), flags: [] });
  start.scene = chapter.entry || start.scene;
  const nodes = new Map();
  const queue = [];
  const dead = new Set();
  const locks = new Map();
  const sceneStates = new Map((chapter.scenes || []).map(scene => [scene.id, 0]));
  const reachable = new Set();
  const displayedPortraits = new Set();
  const outcomes = [];
  const valuesOver = [];
  const miraEchoes = new Set();
  const cacheEchoes = new Set();
  let givePath = null;
  let truncated = false;
  function enqueue(state, trail) {
    const key = stateKey(state);
    if (nodes.has(key)) return nodes.get(key);
    if (nodes.size >= MAX_STATES) { truncated = true; return null; }
    const item = { key, state, trail, edges: [], outcome: false };
    nodes.set(key, item);
    queue.push(item);
    return item;
  }
  enqueue(start, []);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const item = queue[cursor];
    const state = item.state;
    const scene = scenes[state.scene];
    if (!scene) {
      if (state.scene === null || state.scene === undefined) {
        E.deriveEchoes(chapter, state);
        const ending = E.ending(chapter, state, { includeSelf: chapter.id === "fin" });
        item.outcome = true;
        outcomes.push({ state, trail: item.trail, ending, nodeKey: item.key, noScene: true });
        continue;
      }
      dead.add(`${item.trail.at(-1) || "开场"} → next "${state.scene}"（场景不存在）`);
      item.outcome = true;
      outcomes.push({ state, trail: item.trail, ending: null, nodeKey: item.key, missing: true });
      continue;
    }
    reachable.add(scene.id);
    sceneStates.set(scene.id, (sceneStates.get(scene.id) || 0) + 1);
    const portrait = E.resolvePortrait(chapter, scene, state);
    if (portrait) displayedPortraits.add(portrait);
    if (!(scene.choices || []).length) {
      E.deriveEchoes(chapter, state);
      const ending = E.ending(chapter, state, { includeSelf: chapter.id === "fin" });
      item.outcome = true;
      outcomes.push({ state, trail: item.trail, ending, nodeKey: item.key });
      if (!ending) dead.add(`${scene.id} 无选项且未匹配章末结局`);
      if (chapter.id === "c1") {
        if (state.echoes.c1_mira) miraEchoes.add(state.echoes.c1_mira);
        if (state.echoes.c1_cache) cacheEchoes.add(state.echoes.c1_cache);
      }
      const evdStart = Number(startValues.EVD || 0);
      if (Number(state.vals.EVD || 0) - evdStart > 30) valuesOver.push({ trail: item.trail, value: state.vals.EVD });
      continue;
    }
    const choices = E.visibleChoices(scene, state, chapter);
    if (!choices.length) {
      const previous = locks.get(scene.id) || { count: 0, flags: [...(state.flags || [])].sort(), echoes: { ...state.echoes } };
      previous.count++;
      locks.set(scene.id, previous);
      item.outcome = true;
      continue;
    }
    for (const choice of choices) {
      if (chapter.id === "c1" && choice.id === "c1_s03b_give" && !givePath) givePath = [...item.trail, choice.id];
      const nextState = E.clone(state);
      E.apply(nextState, choice, chapter);
      if (chapter.clock && chapter.clock.closing_scene && scene.id !== chapter.clock.closing_scene && nextState.mins >= chapterMinutes(chapter)) {
        nextState.scene = chapter.clock.closing_scene;
      }
      const child = enqueue(nextState, [...item.trail, choice.id]);
      if (child) item.edges.push({ to: child.key, choice: choice.id });
    }
  }
  return { chapter, startValues, scenes, nodes, queue, dead, locks, sceneStates, reachable,
    displayedPortraits, outcomes, valuesOver, miraEchoes, cacheEchoes, givePath, truncated };
}

P(`数据包：schema=${D.game && D.game.schemaVersion} · 章节 ${(D.chapters || []).length} · 回响 ${(D.echoes || []).length} · 伏笔 ${(D.foreshadow || []).length}`);
P(`构建来源：${(D._sources || []).join(", ")}`);

const analyses = {};
for (const chapter of D.chapters || []) {
  const scenes = chapter.scenes || [];
  P(`\n=== ${chapter.id} · ${chapter.title} · ${chapter.status} ===`);
  if (!scenes.length) {
    P("本章场景尚未上线；独立路径枚举跳过，元数据与默认导入仍参与静态检查。");
    continue;
  }
  const result = enumerate(chapter);
  analyses[chapter.id] = result;
  P(`场景 ${scenes.length} · 唯一状态 ${result.nodes.size}${result.truncated ? "（达到上限，已截断）" : ""} · 终点 ${result.outcomes.length}`);
  P(`[死路] ${result.dead.size}`);
  for (const item of result.dead) P(`  - ${item}`);
  P(`[卡死状态] ${[...result.locks.values()].reduce((sum, row) => sum + row.count, 0)}`);
  for (const [id, row] of result.locks) P(`  - ${id} · ${row.count} 个状态 · flags=${JSON.stringify(row.flags)} echoes=${JSON.stringify(row.echoes)}`);
  const unreferenced = scenes.filter(scene => !result.reachable.has(scene.id)).map(scene => scene.id);
  P(`[未引用场景] ${unreferenced.length ? unreferenced.join(", ") : "无"}`);
  const missingFallback = scenes.filter(scene => (scene.choices || []).length && !(scene.choices || []).some(choice =>
    !["when", "requires", "hide_if", "requires_echo", "hide_if_echo"].some(field => Object.prototype.hasOwnProperty.call(choice, field))));
  P(`[缺无条件兜底选项] ${missingFallback.length ? missingFallback.map(scene => scene.id).join(", ") : "无"}`);
  for (const scene of scenes) P(`  状态 ${scene.id}: ${result.sceneStates.get(scene.id) || 0}`);

  const endingsFound = new Map();
  for (const outcome of result.outcomes) if (outcome.ending && !endingsFound.has(outcome.ending.id)) endingsFound.set(outcome.ending.id, outcome);
  P(`[本章结局路径]`);
  const endingDefs = [...(chapter.endings || []), ...(chapter.id === "fin" ? (D.fin_endings || []) : [])];
  for (const ending of endingDefs) {
    const hit = endingsFound.get(ending.id);
    P(`  - ${ending.id}: ${hit ? "可达 · " + (hit.trail.join(" > ") || "（无选择）") : "不可达"}`);
  }
  if (chapter.id === "c1") {
    P(`[自愿交出] ${result.givePath ? "可达 · " + result.givePath.join(" > ") : "不可达：TRU 门槛或路线条件未满足"}`);
    P(`[回响派生覆盖] c1_mira=${[...result.miraEchoes].sort().join(", ") || "无"} · c1_cache=${[...result.cacheEchoes].sort().join(", ") || "无"}`);
    P(`[第一章单线 EVD > 30] ${result.valuesOver.length}`);
    result.valuesOver.forEach(row => P(`  - EVD=${row.value} · ${row.trail.join(" > ")}`));
  }
  const minutes = result.outcomes.map(item => item.state.mins);
  if (minutes.length) P(`[用时范围] ${Math.min(...minutes)}–${Math.max(...minutes)} 分钟 · 终点 ${E.hm(chapter.clock_start, Math.min(...minutes))}–${E.hm(chapter.clock_start, Math.max(...minutes))}`);
}

// New-field structure checks cover every chapter and the separate fin ending table.
const nextStructureErrors = [];
const resultVariantErrors = [];
const missedVariantErrors = [];
for (const chapter of D.chapters || []) {
  const sceneIds = new Set((chapter.scenes || []).map(scene => scene.id));
  for (const scene of chapter.scenes || []) for (const choice of scene.choices || []) {
    if (Array.isArray(choice.next)) {
      if (!choice.next.length) nextStructureErrors.push(`${chapter.id}/${scene.id}/${choice.id}: next 列表为空`);
      choice.next.forEach((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          nextStructureErrors.push(`${chapter.id}/${scene.id}/${choice.id}: next[${index}] 不是对象`);
          return;
        }
        if (typeof item.to !== "string" || !sceneIds.has(item.to)) {
          nextStructureErrors.push(`${chapter.id}/${scene.id}/${choice.id}: next[${index}].to 场景不存在`);
        }
        if (index < choice.next.length - 1 &&
            (!Object.prototype.hasOwnProperty.call(item, "when") || !validConditionShape(item.when))) {
          nextStructureErrors.push(`${chapter.id}/${scene.id}/${choice.id}: next[${index}] 缺少合法 when`);
        }
        if (index === choice.next.length - 1 && Object.prototype.hasOwnProperty.call(item, "when")) {
          nextStructureErrors.push(`${chapter.id}/${scene.id}/${choice.id}: next 最后一项必须无 when`);
        }
      });
    }
    if (choice.result_variants !== undefined && !validateTextVariants(choice.result_variants, "text")) {
      resultVariantErrors.push(`${chapter.id}/${scene.id}/${choice.id}`);
    }
  }
  const endings = [...(chapter.endings || []), ...(chapter.id === "fin" ? D.fin_endings || [] : [])];
  for (const ending of endings) {
    const reviews = [ending.review, ending.review_high, ending.review_low];
    const groups = [ending.missed_variants, ...reviews.map(review =>
      review && typeof review === "object" && !Array.isArray(review) ? review.missed_variants : undefined
    )].filter(value => value !== undefined);
    for (const variants of groups) if (!validateMissedVariants(variants)) missedVariantErrors.push(`${ending.id}`);
  }
}
P(`\n[next 列表最后默认项 / 场景目标] ${nextStructureErrors.length ? "✗ " + nextStructureErrors.join("；") : "通过"}`);
P(`[result_variants 结构] ${resultVariantErrors.length ? "✗ " + resultVariantErrors.join(", ") : "通过"}`);
P(`[missed_variants 结构] ${missedVariantErrors.length ? "✗ " + missedVariantErrors.join(", ") : "通过"}`);
if (nextStructureErrors.length || resultVariantErrors.length || missedVariantErrors.length) fail = 1;

// Cross-chapter flag classification: future registrations/imports are expected, not missing data.
function collectFlagRefs(value, found) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/flag:([A-Za-z_][A-Za-z0-9_.-]*)/g)) found.add(match[1]);
  } else if (Array.isArray(value)) value.forEach(item => collectFlagRefs(item, found));
  else if (value && typeof value === "object") Object.values(value).forEach(item => collectFlagRefs(item, found));
}
function chapterFlags(chapter) {
  const set = new Set(), refs = new Set();
  for (const scene of chapter.scenes || []) for (const choice of scene.choices || []) {
    for (const flag of choice.flags_set || []) set.add(flag);
    for (const field of ["when", "requires", "hide_if", "requires_echo", "hide_if_echo"]) {
      if (field === "requires" || field === "hide_if") {
        const values = Array.isArray(choice[field]) ? choice[field] : [choice[field]];
        for (const item of values) if (typeof item === "string" && !item.includes(":") && !item.includes(" ")) refs.add(item);
      } else collectFlagRefs(choice[field], refs);
    }
    for (const variant of choice.next || []) if (variant && typeof variant === "object") collectFlagRefs(variant.when, refs);
    for (const variant of choice.result_variants || []) collectFlagRefs(variant.when, refs);
  }
  for (const scene of chapter.scenes || []) for (const variant of scene.text_variants || []) collectFlagRefs(variant.when, refs);
  const endingDefs = [...(chapter.endings || []), ...(chapter.id === "fin" ? D.fin_endings || [] : [])];
  for (const ending of endingDefs) {
    collectFlagRefs(ending.when, refs);
    for (const variant of ending.missed_variants || []) collectFlagRefs(variant.when, refs);
    for (const field of ["review", "review_high", "review_low"]) {
      for (const variant of ending[field] && ending[field].missed_variants || []) collectFlagRefs(variant.when, refs);
    }
  }
  for (const bonus of chapter.bonuses || []) collectFlagRefs(bonus.when, refs);
  for (const override of chapter.portrait_overrides || []) collectFlagRefs(override.when, refs);
  return { set, refs };
}
for (const chapter of D.chapters || []) {
  const { set, refs } = chapterFlags(chapter);
  const future = new Set();
  for (const record of D.foreshadow || []) {
    const setter = record.set_in && record.set_in.chapter;
    const laterUse = (record.used_in || []).some(id => chapterOrder.indexOf(id) > chapterOrder.indexOf(chapter.id));
    const laterImport = (D.chapters || []).some(other => chapterOrder.indexOf(other.id) > chapterOrder.indexOf(chapter.id) &&
      ((other.imports || {}).flags || []).includes(record.id));
    if (setter === chapter.id && (laterUse || laterImport)) future.add(record.id);
  }
  const downstream = [...set].filter(flag => future.has(flag));
  const ownUsed = [...set].filter(flag => refs.has(flag) && !future.has(flag));
  const unused = [...set].filter(flag => !refs.has(flag) && !future.has(flag));
  const settersElsewhere = new Map();
  for (const other of D.chapters || []) for (const scene of other.scenes || []) for (const choice of scene.choices || []) {
    for (const flag of choice.flags_set || []) {
      if (!settersElsewhere.has(flag)) settersElsewhere.set(flag, new Set());
      settersElsewhere.get(flag).add(other.id);
    }
  }
  const unset = [...refs].filter(flag => !set.has(flag));
  const priorSetters = unset.filter(flag => [...(settersElsewhere.get(flag) || [])].some(id => chapterOrder.indexOf(id) < chapterOrder.indexOf(chapter.id)));
  const localFuture = unset.filter(flag => {
    const record = (D.foreshadow || []).find(item => item.id === flag);
    return record && record.set_in && record.set_in.chapter === chapter.id && !(chapter.scenes || []).length;
  });
  const futureSetters = unset.filter(flag => {
    const record = (D.foreshadow || []).find(item => item.id === flag);
    return record && record.set_in && record.set_in.chapter !== chapter.id && chapterById[record.set_in.chapter] &&
      !(chapterById[record.set_in.chapter].scenes || []).length;
  });
  if (chapter.status === "coming_soon" && !(chapter.scenes || []).length) {
    for (const flag of unset) if (!futureSetters.includes(flag) && !priorSetters.includes(flag) && !localFuture.includes(flag)) localFuture.push(flag);
  }
  const remainingUnset = unset.filter(flag => !priorSetters.includes(flag) && !localFuture.includes(flag) && !futureSetters.includes(flag));
  P(`\n[${chapter.id} flags] 本章设置/本章使用：${ownUsed.join(", ") || "无"}`);
  P(`[${chapter.id} flags] 本章设置、后续章节使用：${downstream.join(", ") || "无"}`);
  P(`[${chapter.id} flags] 设置了无人使用：${unused.join(", ") || "无"}`);
  P(`[${chapter.id} flags] 引用上游已设置：${priorSetters.join(", ") || "无"}`);
  P(`[${chapter.id} flags] 由未上线章节设置：${[...futureSetters, ...localFuture].join(", ") || "无"}`);
  P(`[${chapter.id} flags] 引用但无人设置：${remainingUnset.join(", ") || "无"}`);
}

// Effects and key-choice amplitude diagnostics use the requested balance thresholds.
P("\n[抉择幅度报警]");
let amplitudeCount = 0;
for (const chapter of D.chapters || []) {
  for (const scene of chapter.scenes || []) for (const choice of scene.choices || []) {
    if (choice.echo_set && !choice.key) {
      P(`  - echo_set 出现在非 key 选项：${scene.id}/${choice.id}`); amplitudeCount++;
    }
    for (const [value, raw] of Object.entries(choice.effects || {})) {
      const amount = Number(raw);
      const limit = choice.key ? (value === "EVD" ? 10 : 20) : (value === "EVD" ? 8 : 10);
      if (Math.abs(amount) > limit) {
        P(`  - ${chapter.id} ${choice.key ? "关键" : "普通"}抉择 ${scene.id}/${choice.id} ${value}:${amount} 超 ±${limit}`);
        amplitudeCount++;
      }
    }
  }
  for (const bonus of chapter.bonuses || []) for (const [value, raw] of Object.entries(bonus.effects || {})) {
    if (Math.abs(Number(raw)) > 5) { P(`  - 联动奖励 ${chapter.id}/${bonus.id} ${value}:${raw} 超 ±5`); amplitudeCount++; }
  }
}
if (!amplitudeCount) P("  无");

// Image report covers scene art, choice thumbs, actual portraits, all ending cards, chapter cards and echo icons.
const chapterEndings = (D.chapters || []).filter(chapter => chapter.id !== "fin").flatMap(chapter => chapter.endings || []);
const imageNeeds = [];
for (const result of Object.values(analyses)) {
  for (const scene of result.chapter.scenes || []) {
    if (scene.bg) imageNeeds.push(["场景", scene.bg, scene.bg]);
    for (const choice of scene.choices || []) imageNeeds.push(["缩略图", choice.id, "thumb:" + choice.id]);
  }
  for (const portrait of result.displayedPortraits) imageNeeds.push(["立绘", portrait, "portrait:" + portrait]);
}
for (const chapter of D.chapters || []) imageNeeds.push(["章节卡 3:4", chapter.id, "chapter:" + chapter.id]);
for (const ending of chapterEndings) imageNeeds.push(["小结局卡", ending.id, "ending:" + ending.id]);
for (const override of D.portrait_overrides || []) if (override.to) imageNeeds.push(["立绘替换目标", override.to, "portrait:" + override.to]);
for (const icon of ["icon_ending", "icon_log", "icon_echo", "icon_review", "icon_savecode"])
  imageNeeds.push(["档案分区图标", icon, "icon:" + icon]);
for (const echo of D.echoes || []) {
  const hasSpecificIcon = !!(D.echo_icon_assets || {})[echo.icon];
  imageNeeds.push(["回响图标", echo.icon, "icon:" + (hasSpecificIcon ? echo.icon : "icon_echo")]);
}
const missingImages = imageNeeds.filter(([, , key]) => !(D.images || {})[key]);
P(`\n[缺图清单] ${missingImages.length}/${imageNeeds.length}`);
for (const [kind, name, key] of missingImages) P(`  - ${kind}: ${name} (${key})`);

function rasterStem(file) {
  return path.basename(file).replace(/_v\d+\.(?:webp|png)$/i, "");
}
function endingImageStem(image) {
  const name = path.posix.basename(String(image).replace(/\\/g, "/"));
  return path.parse(name).name.replace(/_v\d+$/i, "");
}
function imageSize(filename) {
  try {
    const data = fs.readFileSync(filename);
    if (data.length > 24 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
    }
    if (data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") {
      const kind = data.toString("ascii", 12, 16);
      if (kind === "VP8X") return { width: 1 + data.readUIntLE(24, 3), height: 1 + data.readUIntLE(27, 3) };
      if (kind === "VP8L") {
        const b1 = data[21], b2 = data[22], b3 = data[23], b4 = data[24];
        return { width: 1 + b1 + ((b2 & 0x3f) << 8), height: 1 + ((b2 & 0xc0) >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10) };
      }
      if (kind === "VP8 " && data[23] === 0x9d && data[24] === 0x01 && data[25] === 0x2a) {
        return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
      }
    }
  } catch (_) { /* Report dimensions as unavailable below. */ }
  return null;
}
const registeredEndingIds = new Set([...chapterEndings, ...(D.fin_endings || [])].map(ending => ending.id));
const endingAssets = new Set((D.asset_inventory.rasters || []).map(rasterStem).filter(stem => stem.startsWith("ending_")));
const extraEndingAssets = [...endingAssets].filter(stem => !registeredEndingIds.has(stem.slice("ending_".length))).sort();
P(`\n[art/out 未匹配 ending_*] ${extraEndingAssets.length ? extraEndingAssets.join(", ") : "无"}`);
const allEndings = [...chapterEndings, ...(D.fin_endings || [])];
const rasterStems = new Set((D.asset_inventory.rasters || []).map(rasterStem).map(stem => stem.toLocaleLowerCase()));
const missingEndingImageFields = allEndings.filter(ending => ending.image &&
  !rasterStems.has(endingImageStem(ending.image).toLocaleLowerCase()));
P(`[结局 image 字段指向缺图] ${missingEndingImageFields.length}`);
for (const ending of missingEndingImageFields) {
  const fallback = (D.images || {})[`ending:${ending.id}`];
  P(`  - ${ending.id}: ${ending.image}（${fallback ? `结局卡回退到 ${fallback}` : "将显示文字占位"}）`);
}
const c1SmallEndings = (chapterById.c1 && chapterById.c1.endings) || [];
const c1EndingAssets = c1SmallEndings.map(ending => ({
  ending,
  asset: (D.images || {})[`ending:${ending.id}`] || null,
  target: ending.image ? endingImageStem(ending.image).toLocaleLowerCase() : null
}));
const c1EndingResolved = c1EndingAssets.filter(({ asset }) => !!asset);
P(`\n[c1 小结局图解析] ${c1EndingResolved.length}/${c1SmallEndings.length}`);
for (const { ending, asset, target } of c1EndingAssets) {
  const selectedStem = asset ? rasterStem(asset).toLocaleLowerCase() : null;
  const targetFound = target && rasterStems.has(target);
  const sourceMatches = targetFound && selectedStem === target;
  P(`  - ${ending.id}: ${asset ? `${asset}${sourceMatches ? " · image 字段" : " · id 回退"}` : "文字占位"}`);
  if (targetFound && !sourceMatches) fail = 1;
}
if (c1SmallEndings.length !== 5 || c1EndingResolved.length !== 5) fail = 1;
const archiveIconRefs = ["icon_ending", "icon_log", "icon_echo", "icon_review", "icon_savecode"];
const referencedIcons = new Set([...archiveIconRefs, ...(D.echoes || []).map(echo => echo.icon)]);
const iconStems = new Set((D.asset_inventory.icons || []).map(file => path.basename(file).replace(/_v\d+\.svg$/i, "").replace(/\.svg$/i, "")));
P(`[icons 未被引用] ${[...iconStems].filter(stem => !referencedIcons.has(stem)).sort().join(", ") || "无"}`);
const missingEchoIcons = [...new Set((D.echoes || []).filter(echo => !(D.echo_icon_assets || {})[echo.icon]).map(echo => echo.icon))];
const echoIconFallback = (D.images || {})["icon:icon_echo"] ? "已回退 icon_echo" : "icon_echo 缺失，将显示色点";
P(`[提示级·被引用但缺失的回响专属图标] ${missingEchoIcons.length ? `${missingEchoIcons.join(", ")}（${echoIconFallback}）` : "无"}`);
P("[章节卡比例]");
for (const chapter of D.chapters || []) {
  const source = (D.images || {})["chapter:" + chapter.id];
  if (!source) { P(`  - ${chapter.id}: 缺失`); continue; }
  const size = imageSize(path.join(__dirname, source));
  if (!size) { P(`  - ${chapter.id}: ${source} · 尺寸无法读取`); continue; }
  const ratio = size.width / size.height;
  P(`  - ${chapter.id}: ${size.width}×${size.height} · ${Math.abs(ratio - 0.75) < 0.02 ? "3:4" : "非 3:4"}`);
}

// First-chapter transition parity: enumerate all states independently in both engines.
function reachableTransitions(engine, chapter) {
  const scenes = sceneTable(chapter);
  const values = engine.carryValues({}, chapter);
  const start = engine.initState(chapter, { values, echoes: importedDefaults(chapter), flags: [] });
  start.scene = chapter.entry || start.scene;
  const states = new Map(), transitions = new Map(), queue = [start];
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
      if (chapter.clock && chapter.clock.closing_scene && scene.id !== chapter.clock.closing_scene && next.mins >= chapterMinutes(chapter)) {
        next.scene = chapter.clock.closing_scene;
      }
      const target = stateKey(next);
      edges.push([choice.id, target, JSON.stringify(next)]);
      queue.push(next);
    }
    edges.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    transitions.set(key, JSON.stringify(edges));
  }
  return { states, transitions, truncated };
}
const firstChapter = chapterById.c1 || (D.chapters || [])[0];
if (firstChapter && (firstChapter.scenes || []).length) {
  const oldTransitions = reachableTransitions(E0, firstChapter);
  const newTransitions = reachableTransitions(E, firstChapter);
  const stateKeys = new Set([...oldTransitions.states.keys(), ...newTransitions.states.keys()]);
  const transitionDiffs = [...stateKeys].filter(key => oldTransitions.transitions.get(key) !== newTransitions.transitions.get(key));
  P(`\n[第一章引擎转移对比] engine.js 状态=${oldTransitions.states.size} · engine_v2.js 状态=${newTransitions.states.size} · 差异数=${transitionDiffs.length}`);
  if (oldTransitions.truncated || newTransitions.truncated) {
    P("  ✗ 状态超过枚举上限，无法完成全状态对比");
    fail = 1;
  }
  if (transitionDiffs.length) {
    for (const key of transitionDiffs.slice(0, 10)) P(`  - ${key}`);
    fail = 1;
  }
} else {
  P("\n[第一章引擎转移对比] ✗ 第一章没有可枚举场景");
  fail = 1;
}

// Engine self-checks. Only a failed self-check makes this script exit non-zero.
const state = { vals: { TRU: 3, EVD: 5 }, flags: ["x", "y", "cause=K1"], echoes: { c1_mira: "asked" } };
const okExpressions = E.evalWhen("TRU >= 3 && flag:x", state) &&
  E.evalWhen("echo:c1_mira==asked", state) && E.evalWhen("echo:c1_mira in [mended,asked]", state) &&
  E.evalWhen("echo:c1_mira==asked && EVD < 8 && flag:y", state) && !E.evalWhen("echo:c1_mira==forced", state);
const echoVisibility = { choices: [
  { id: "requires", requires_echo: { c1_mira: ["asked", "mended"] } },
  { id: "hidden", hide_if_echo: { c1_mira: ["asked"] } },
  { id: "and", when: "TRU >= 3", requires: ["x"], hide_if: ["blocked"], requires_echo: { echo: { c1_mira: ["asked"] } } }
] };
const visibleEcho = E.visibleChoices(echoVisibility, state).map(choice => choice.id);
const forcedVisible = E.visibleChoices(echoVisibility, { ...state, echoes: { c1_mira: "forced" } }).map(choice => choice.id);
const okEchoVisibility = visibleEcho.length === 2 && visibleEcho.includes("requires") && visibleEcho.includes("and") &&
  forcedVisible.length === 1 && forcedVisible[0] === "hidden";
const variantScene = {
  text: "base",
  text_variants: [{ when: "flag:x", text: "first" }, { when: "echo:c1_mira==asked", text: "second" }],
  text_by_echo: { c1_mira: { asked: ["mapped"], _: ["echo fallback"] } }
};
const mappedText = E.sceneText({ ...variantScene, text_variants: [{ when: "false", text: "no" }, { when: "false", text: "also no" }] }, state);
const echoFallbackText = E.sceneText({ text_by_echo: { c1_mira: { forced: ["forced"], _: ["default"] } } }, { echoes: { c1_mira: "unknown" } });
const okText = E.sceneText(variantScene, state) === "first" && Array.isArray(mappedText) && mappedText[0] === "mapped" &&
  Array.isArray(echoFallbackText) && echoFallbackText[0] === "default";
const variantChoice = { result: "base", result_variants: [
  { when: "false", text: "no" }, { when: "flag:x", text: "first" }, { when: "true", text: "also first" }
], result_by_echo: { c1_mira: { asked: ["mapped"], _: ["echo fallback"] } } };
const echoChoice = { result: "base", result_by_echo: { c1_mira: { forced: ["forced"], _: ["default"] } } };
const okChoiceResult = E.choiceResult(variantChoice, state) === "first" &&
  E.choiceResult(echoChoice, { echoes: { c1_mira: "forced" } })[0] === "forced" &&
  E.choiceResult({ result: "base" }, state) === "base";
const carryChapter = { values_in: { defaults: { EVD: 0, TRU: 0, EXP: 10, SLF: 0 }, carry: { EVD: "keep", TRU: "keep", SLF: "keep", EXP: { add: -20, min: 0 } } } };
const okCarry = E.carryValues({ EVD: 40, TRU: 60, EXP: 5, SLF: 15 }, carryChapter).EXP === 0 &&
  E.carryValues({ EVD: 40, TRU: 60, EXP: 50, SLF: 15 }, carryChapter).EXP === 30;
const devDefaults = E.defaultValues({ ...carryChapter, values: carryChapter.values_in.defaults });
const okDevDefaults = devDefaults.EXP === 10 && devDefaults.EVD === 0;
const replayArchive = E.newArchive();
replayArchive.runs.r1 = { chapter: "c1", echoesOut: { c1_mira: "asked" }, flagsOut: ["a"] };
E.completeRun(replayArchive, "r1", null, ["c1", "c2"]);
replayArchive.runs.r2 = { chapter: "c2", echoesOut: {}, flagsOut: [] };
E.completeRun(replayArchive, "r2", null, ["c1", "c2"]);
replayArchive.runs.r3 = { chapter: "c1", echoesOut: { c1_mira: "forced" }, flagsOut: ["a"] };
const defaultDecision = E.defaultReplayDestination();
E.completeRun(replayArchive, "r3", defaultDecision, ["c1", "c2"]);
const archiveOnlyOk = replayArchive.mainline.c1 === "r1" && !replayArchive.runs.r2.stale;
replayArchive.runs.r4 = { chapter: "c1", echoesOut: { c1_mira: "forced" }, flagsOut: ["b"] };
E.completeRun(replayArchive, "r4", "mainline", ["c1", "c2"]);
const okStale = replayArchive.mainline.c1 === "r4" && replayArchive.runs.r2.stale === true;
const migrated = E.migrateLegacy(E.newArchive(), { scene: "c1_s02a", vals: { EVD: 8 }, flags: ["read_chat"], mins: 3 });
const migrationSource = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
const okMigration = !!migrated.inProgress && migrated.inProgress.scene === "c1_s02a" &&
  migrationSource.includes('getItem("cx_save")') && !migrationSource.includes('removeItem("cx_save")');
const boundsD = { values: { EVD: { init: 95, min: 0, max: 100 } }, scenes: [{ id: "a" }], bonuses: [] };
const bounded = E.initState(boundsD);
E.apply(bounded, { id: "up", label: "up", effects: { EVD: 20 }, next: "b" }, boundsD);
E.apply(bounded, { id: "down", label: "down", effects: { EVD: -200 }, next: "c" }, boundsD);
const okClamp = E.initState(boundsD).vals.EVD === 95 && bounded.vals.EVD === 0;
const bonusD = { bonuses: [{ id: "b", when: "flag:a && flag:b", effects: { EVD: 10 } }], values: {} };
const bonusState = { vals: { EVD: 0 }, flags: ["a", "b"], echoes: {}, log: [], bonuses: [], mins: 0 };
E.checkBonuses(bonusD, bonusState); E.checkBonuses(bonusD, bonusState);
const okBonus = bonusState.vals.EVD === 10 && bonusState.log.length === 1;
const variantEnding = E.ending({ endings: [{ id: "X", when: "true", variant: "TRU >= 60", review: { self_hint: "hint" } }], self_endings: [{ id: "S", when: "SLF < 35" }] }, { vals: { TRU: 70, SLF: 0 }, flags: [], echoes: {} });
const okChapterSelf = variantEnding.high === true && variantEnding.selves.length === 0;
const finEnding = E.ending({ endings: [{ id: "F", when: "true" }], self_endings: [{ id: "S", when: "SLF < 35" }] }, { vals: { SLF: 0 }, flags: [], echoes: {} }, { includeSelf: true });
const okFinSelf = finEnding.selves[0] === "S";
const fallbackEnding = E.ending({ endings: [{ id: "A", when: "false" }, { id: "F", when: "true", same_as: "A" }] }, { vals: {}, flags: [], echoes: {} });
const okFallback = fallbackEnding.id === "F" && fallbackEnding.shown === "A";
const portraitD = { portrait_overrides: [
  { when: "flag:forced", from: "mira_lv1", to: "mira_broken" },
  { when: "echo:c1_mira==forced", from: "mira_broken", to: "mira_static" }
] };
const portraitScene = { portrait: "mira_lv1" };
const okPortrait = E.resolvePortrait(portraitD, portraitScene, { flags: ["forced"], echoes: { c1_mira: "forced" } }) === "mira_static" &&
  E.resolvePortrait(portraitD, portraitScene, { flags: [], echoes: {} }) === "mira_lv1";
const nextChapter = { values: { EVD: { init: 0 } }, scenes: [], bonuses: [] };
const nextState = E.initState(nextChapter, { scene: "start", flags: [], echoes: { c1_mira: "old" } });
E.apply(nextState, { id: "branch", key: true, effects: { EVD: 1 }, echo_set: { c1_mira: "asked" }, flags_set: ["ready"],
  next: [
    { when: "EVD == 1 && echo:c1_mira==asked && flag:ready", to: "matched" },
    { when: "true", to: "later" }, { to: "default" }
  ]
}, nextChapter);
const nextDefault = E.initState(nextChapter, { scene: "start", flags: [], echoes: {} });
E.apply(nextDefault, { id: "default", next: [{ when: "false", to: "later" }, { to: "default" }] }, nextChapter);
const okConditionalNext = nextState.scene === "matched" && nextDefault.scene === "default";
const missedEnding = E.ending({ endings: [{ id: "M", when: "true", review: { missed: ["base"], missed_variants: [
  { when: "false", text: ["no"] }, { when: "flag:x", text: ["selected"] }
] } }] }, state);
const okMissedVariants = missedEnding.review.missed.length === 1 && missedEnding.review.missed[0] === "selected";
let warnings = 0;
const oldWarn = console.warn;
console.warn = () => { warnings++; };
const invalidA = E.evalWhen("EVD >>> 2", state), invalidB = E.evalWhen("EVD >>> 2", state);
console.warn = oldWarn;
const engineSource = fs.readFileSync(path.join(__dirname, "engine.js"), "utf8");
const engineV2Source = fs.readFileSync(path.join(__dirname, "engine_v2.js"), "utf8");
const noDynamicCode = !/\bFunction\s*\(/.test(engineSource) && !/\beval\s*\(/.test(engineSource) &&
  !/\bFunction\s*\(/.test(engineV2Source) && !/\beval\s*\(/.test(engineV2Source);
const checks = {
  "echo 条件/混合": okExpressions,
  "requires_echo / hide_if_echo 与其它条件独立组合": okEchoVisibility,
  "text_variants 顺序 / text_by_echo / _ 回退": okText,
  "选项 result_variants / result_by_echo": okChoiceResult,
  "next 条件列表后结算 effects / echo_set / flags_set 并使用默认项": okConditionalNext,
  "结局 missed_variants": okMissedVariants,
  "EXP carry -20 下限 0": okCarry,
  "开发模式使用 defaults 而不套 carry": okDevDefaults,
  "重玩默认只收入档案": defaultDecision === "archive" && archiveOnlyOk,
  "写入主线后 stale 标记": okStale,
  "cx_save 迁移且保留旧 key": okMigration,
  "数值 init/min/max 夹紧": okClamp,
  "bonuses once": okBonus,
  "章节不结算自我结局 / 终章结算": okChapterSelf && okFinSelf,
  "same_as 结局回退": okFallback,
  "立绘 override 顺序覆盖": okPortrait,
  "条件解析失败只警告一次": !invalidA && !invalidB && warnings === 1,
  "无 eval / Function": noDynamicCode
};
P("\n[引擎自检]");
for (const [name, ok] of Object.entries(checks)) P(`  ${ok ? "✓" : "✗"} ${name}`);
if (Object.values(checks).some(value => !value)) fail = 1;
for (const chapter of D.chapters || []) {
  const errors = E.validateEchoSets({ scenes: chapter.scenes || [], echoes: D.echoes || [] });
  P(`[${chapter.id} echo_set 校验] ${errors.length ? errors.join("；") : "通过"}`);
}

const report = out.join("\n") + "\n";
console.log(report);
process.exitCode = fail;
