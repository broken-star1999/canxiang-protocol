// Shared browser/Node game logic. Conditions use a small parser; dynamic code is never evaluated.
(function (G) {
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);
  const warned = new Set();
  const parsed = new Map();
  const BAD = {};

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }
  function warnOnce(key, message) {
    if (warned.has(key)) return;
    warned.add(key);
    if (typeof console !== "undefined" && console.warn) console.warn(message);
  }
  function valueConfig(D, key) {
    const raw = (D.values || {})[key];
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
  }
  function clampValue(D, key, value) {
    const config = valueConfig(D, key);
    let n = Number(value);
    if (!Number.isFinite(n)) n = 0;
    if (config && config.min !== undefined) n = Math.max(Number(config.min), n);
    if (config && config.max !== undefined) n = Math.min(Number(config.max), n);
    return n;
  }
  function initState(D, input) {
    input = input || {};
    const vals = {};
    for (const [key, raw] of Object.entries(D.values || {})) {
      const init = raw && typeof raw === "object" && !Array.isArray(raw) ? raw.init : raw;
      const supplied = input.values && own(input.values, key) ? input.values[key] : init;
      vals[key] = clampValue(D, key, supplied === undefined ? 0 : supplied);
    }
    return {
      scene: input.scene || D.entry || (D.scenes && D.scenes[0] && D.scenes[0].id) || null,
      vals,
      flags: [...new Set(input.flags || [])],
      echoes: Object.assign({}, input.echoes || {}),
      mins: Number(input.mins || 0),
      log: clone(input.log || []),
      keys: clone(input.keys || []),
      bonuses: clone(input.bonuses || []),
      curve: clone(input.curve || [])
    };
  }
  function defaultValues(chapter) {
    const defaults = (chapter.values_in || {}).defaults || {};
    const D = { values: chapter.values || defaults };
    const result = {};
    for (const [key, raw] of Object.entries(defaults)) {
      const init = raw && typeof raw === "object" && !Array.isArray(raw) ? raw.init : raw;
      result[key] = clampValue(D, key, init === undefined ? 0 : init);
    }
    return result;
  }
  function hm(start, minutes) {
    const [hour, minute] = (start || "00:00").split(":").map(Number);
    const total = hour * 60 + minute + Number(minutes || 0);
    return String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
  }

  function tokenize(source) {
    const tokens = [];
    const re = /\s*(>=|<=|==|!=|&&|\|\||[()!<>\[\],]|:|(?:\d+(?:\.\d*)?|\.\d+)|[A-Za-z_][A-Za-z0-9_.-]*)/y;
    let offset = 0;
    while (offset < source.length) {
      if (!source.slice(offset).trim()) break;
      re.lastIndex = offset;
      const match = re.exec(source);
      if (!match) throw new Error("无效字符");
      tokens.push(match[1]);
      offset = re.lastIndex;
    }
    return tokens;
  }
  function parseExpression(source) {
    const tokens = tokenize(source);
    let index = 0;
    const peek = () => tokens[index];
    const take = token => {
      if (tokens[index] !== token) throw new Error("缺少 " + token);
      index++;
    };
    const parsePrimary = () => {
      const token = peek();
      if (token === undefined) throw new Error("缺少条件");
      if (token === "(") {
        index++;
        const node = parseOr();
        take(")");
        return node;
      }
      if (token === "flag" || token === "echo") {
        index++;
        take(":");
        const name = peek();
        if (!name || !/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name)) throw new Error(token + " 名无效");
        index++;
        return { type: token, name };
      }
      if (token === "true" || token === "false") {
        index++;
        return { type: "literal", value: token === "true" };
      }
      if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) {
        index++;
        return { type: "literal", value: Number(token) };
      }
      if (/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(token)) {
        index++;
        return { type: "name", name: token };
      }
      throw new Error("条件项无效");
    };
    const parseComparison = () => {
      const left = parsePrimary();
      if (peek() === "in") {
        index++;
        take("[");
        const items = [];
        if (peek() !== "]") {
          while (true) {
            items.push(parsePrimary());
            if (peek() !== ",") break;
            index++;
          }
        }
        take("]");
        return { type: "in", left, items };
      }
      if ([">", ">=", "<", "<=", "==", "!="].includes(peek())) {
        const op = tokens[index++];
        return { type: "compare", op, left, right: parsePrimary() };
      }
      return { type: "truthy", value: left };
    };
    const parseUnary = () => {
      if (peek() === "!") {
        index++;
        return { type: "not", value: parseUnary() };
      }
      return parseComparison();
    };
    const parseAnd = () => {
      let node = parseUnary();
      while (peek() === "&&") {
        index++;
        node = { type: "and", left: node, right: parseUnary() };
      }
      return node;
    };
    const parseOr = () => {
      let node = parseAnd();
      while (peek() === "||") {
        index++;
        node = { type: "or", left: node, right: parseAnd() };
      }
      return node;
    };
    const ast = parseOr();
    if (index !== tokens.length) throw new Error("条件末尾有多余内容");
    return ast;
  }
  function conditionKey(condition) {
    try { return JSON.stringify(condition); } catch (_) { return String(condition); }
  }
  function parseCached(source) {
    const key = String(source);
    if (parsed.has(key)) return parsed.get(key);
    try {
      const ast = parseExpression(key);
      parsed.set(key, ast);
      return ast;
    } catch (_) {
      parsed.set(key, BAD);
      warnOnce("expr:" + key, "条件解析失败，按 false 处理：" + key);
      return BAD;
    }
  }
  function resolve(node, st, D) {
    if (node.type === "literal") return node.value;
    if (node.type === "flag") return (st.flags || []).includes(node.name);
    if (node.type === "echo") return own(st.echoes, node.name) ? { echoValue: st.echoes[node.name] } : { echoMissing: true };
    if (node.type === "name") {
      if (own(st.vals, node.name)) return Number(st.vals[node.name]);
      return { symbol: node.name, unresolved: true };
    }
    return undefined;
  }
  function isUnresolvedName(node, st) {
    return node && node.type === "name" && !own(st.vals, node.name);
  }
  function symbolValue(value) {
    return value && value.unresolved ? value.symbol : value;
  }
  function comparableEqual(a, b) {
    a = symbolValue(a); b = symbolValue(b);
    if (a && a.echoValue !== undefined) a = a.echoValue;
    if (b && b.echoValue !== undefined) b = b.echoValue;
    if (a && a.echoMissing || b && b.echoMissing) return false;
    return a === b;
  }
  function compare(node, st, D) {
    const a = resolve(node.left, st, D);
    const b = resolve(node.right, st, D);
    if ((node.op === "==" || node.op === "!=") && node.left.type === "echo") {
      const equal = comparableEqual(a, b);
      return node.op === "==" ? equal : !equal;
    }
    if ((node.op === "==" || node.op === "!=") && isUnresolvedName(node.left, st) && b && b.unresolved) {
      const has = (st.flags || []).includes(node.left.name + "=" + b.symbol);
      return node.op === "==" ? has : !has;
    }
    if (node.op === "==") return comparableEqual(a, b);
    if (node.op === "!=") return !comparableEqual(a, b);
    if (typeof a !== "number" || typeof b !== "number") return false;
    if (node.op === ">") return a > b;
    if (node.op === ">=") return a >= b;
    if (node.op === "<") return a < b;
    if (node.op === "<=") return a <= b;
    return false;
  }
  function evalAst(node, st, D) {
    switch (node.type) {
      case "literal": return !!node.value;
      case "flag": return (st.flags || []).includes(node.name);
      case "truthy": {
        const value = resolve(node.value, st, D);
        return typeof value === "number" ? value !== 0 : typeof value === "boolean" ? value : false;
      }
      case "not": return !evalAst(node.value, st, D);
      case "and": return evalAst(node.left, st, D) && evalAst(node.right, st, D);
      case "or": return evalAst(node.left, st, D) || evalAst(node.right, st, D);
      case "compare": return compare(node, st, D);
      case "in": {
        if (node.left.type === "echo") {
          const current = resolve(node.left, st, D);
          return node.items.some(item => comparableEqual(current, resolve(item, st, D)));
        }
        if (isUnresolvedName(node.left, st)) {
          return node.items.some(item => {
            const value = resolve(item, st, D);
            return (st.flags || []).includes(node.left.name + "=" + String(symbolValue(value)));
          });
        }
        const left = resolve(node.left, st, D);
        return node.items.some(item => comparableEqual(left, resolve(item, st, D)));
      }
      default: return false;
    }
  }
  function evalConditionObject(condition, st, D) {
    const keys = Object.keys(condition);
    if (!keys.length || keys.some(key => key !== "all" && key !== "any")) {
      warnOnce("object:" + conditionKey(condition), "条件对象格式无效，按 false 处理：" + conditionKey(condition));
      return false;
    }
    for (const key of keys) {
      const list = condition[key];
      if (!Array.isArray(list)) {
        warnOnce("object:" + conditionKey(condition), "条件对象格式无效，按 false 处理：" + conditionKey(condition));
        return false;
      }
      const results = list.map(item => {
        if (typeof item !== "string" && (!item || typeof item !== "object" || Array.isArray(item))) {
          warnOnce("object:" + conditionKey(condition), "条件对象元素无效，按 false 处理：" + conditionKey(condition));
          return false;
        }
        return evalWhen(item, st, D);
      });
      if (key === "all" && !results.every(Boolean)) return false;
      if (key === "any" && !results.some(Boolean)) return false;
    }
    return true;
  }
  function evalWhen(condition, st, D) {
    if (condition === undefined || condition === null) return true;
    if (typeof condition === "boolean") return condition;
    if (typeof condition === "object" && !Array.isArray(condition)) return evalConditionObject(condition, st, D);
    if (typeof condition !== "string") {
      warnOnce("condition:" + conditionKey(condition), "条件格式无效，按 false 处理：" + conditionKey(condition));
      return false;
    }
    const ast = parseCached(condition);
    if (ast === BAD) return false;
    try { return !!evalAst(ast, st, D); }
    catch (_) {
      warnOnce("eval:" + condition, "条件求值失败，按 false 处理：" + condition);
      return false;
    }
  }
  function resolvePortrait(D, scene, st) {
    let portrait = scene && scene.portrait;
    if (!portrait) return portrait;
    for (const override of D.portrait_overrides || []) {
      if (override && override.from === portrait && evalWhen(override.when, st, D)) portrait = override.to;
    }
    return portrait;
  }
  function asList(value, field, id) {
    if (value === undefined) return [];
    if (value === null) {
      warnOnce(field + ":" + id + ":null", field + " 格式无效，按不满足处理：" + id);
      return null;
    }
    const list = Array.isArray(value) ? value : [value];
    if (list.every(item => typeof item === "string")) return list;
    warnOnce(field + ":" + id + ":" + conditionKey(value), field + " 格式无效，按不满足处理：" + id);
    return null;
  }
  function echoConstraints(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (value.echo && typeof value.echo === "object" && !Array.isArray(value.echo)) return value.echo;
    if (Array.isArray(value.echo) && value.echo_id) return { [value.echo_id]: value.echo };
    if (typeof value.echo === "string" && Array.isArray(value.values)) return { [value.echo]: value.values };
    return value;
  }
  function matchesEchoConstraint(value, st, shouldHide) {
    const mapping = echoConstraints(value);
    if (!mapping) return false;
    const results = [];
    for (const [echoId, rawAllowed] of Object.entries(mapping)) {
      const allowed = Array.isArray(rawAllowed) ? rawAllowed : [rawAllowed];
      results.push(allowed.includes((st.echoes || {})[echoId]));
    }
    return shouldHide ? results.some(Boolean) : results.length > 0 && results.every(Boolean);
  }
  function visibleChoices(scene, st, D) {
    return (scene && scene.choices || []).filter(choice => {
      if (own(choice, "when") && !evalWhen(choice.when, st, D)) return false;
      if (own(choice, "requires")) {
        const required = asList(choice.requires, "requires", choice.id);
        if (!required || !required.every(flag => (st.flags || []).includes(flag))) return false;
      }
      if (own(choice, "hide_if")) {
        const hidden = asList(choice.hide_if, "hide_if", choice.id);
        if (!hidden || hidden.some(flag => (st.flags || []).includes(flag))) return false;
      }
      if (own(choice, "requires_echo") && !matchesEchoConstraint(choice.requires_echo, st, false)) return false;
      if (own(choice, "hide_if_echo") && matchesEchoConstraint(choice.hide_if_echo, st, true)) return false;
      return true;
    });
  }
  function eff(st, effects, D) {
    for (const [key, value] of Object.entries(effects || {})) {
      st.vals[key] = clampValue(D || { values: {} }, key, Number(st.vals[key] || 0) + Number(value));
    }
  }
  function checkBonuses(D, st) {
    st.bonuses = st.bonuses || [];
    st.log = st.log || [];
    for (const bonus of D.bonuses || []) {
      if (bonus.once !== false && st.bonuses.includes(bonus.id)) continue;
      if (evalWhen(bonus.when, st, D)) {
        eff(st, bonus.effects, D);
        st.bonuses.push(bonus.id);
        st.log.push({ text: "［联动］" + (bonus.log || bonus.id), at: st.mins, bonus: true });
      }
    }
  }
  function apply(st, choice, D) {
    const sourceScene = st.scene;
    st.flags = st.flags || [];
    st.echoes = st.echoes || {};
    st.log = st.log || [];
    st.keys = st.keys || [];
    eff(st, choice.effects, D);
    if (choice.echo_set !== undefined) {
      if (!choice.key) warnOnce("echo-key:" + choice.id, "echo_set 只能用于 key:true 选项：" + choice.id);
      else for (const [echoId, value] of Object.entries(choice.echo_set || {})) st.echoes[echoId] = value;
    }
    for (const flag of choice.flags_set || []) if (!st.flags.includes(flag)) st.flags.push(flag);
    const next = resolveNext(choice.next, st, D);
    st.mins += Number(choice.time || 0);
    st.log.push({ text: String(choice.log || choice.label || choice.id).replace(/^\d\d:\d\d\s*/, ""), at: st.mins, key: !!choice.key, scene: sourceScene || null, choice: choice.id });
    if (choice.key) st.keys.push(choice.label || choice.id);
    st.scene = next || null;
    if (D && D.clock && D.clock.end && D.clock.start) {
      const [sh, sm] = D.clock.start.split(":").map(Number);
      const [eh, em] = D.clock.end.split(":").map(Number);
      const limit = eh * 60 + em - sh * 60 - sm;
      if (limit >= 0 && st.mins >= limit) {
        if (D.clock.closing_scene && sourceScene !== D.clock.closing_scene && st.scene !== null) st.scene = D.clock.closing_scene;
        st.mins = limit;
      }
    }
    st.curve = st.curve || [];
    st.curve.push({ t: st.mins, ...clone(st.vals) });
    if (D) checkBonuses(D, st);
  }
  function resolveNext(next, st, D) {
    if (!Array.isArray(next)) return next || null;
    for (const branch of next) {
      if (!branch || typeof branch !== "object" || Array.isArray(branch)) continue;
      if (!own(branch, "when") || evalWhen(branch.when, st, D)) return branch.to || null;
    }
    return null;
  }
  function deriveEchoes(D, st) {
    st.echoes = st.echoes || {};
    for (const echo of D.echoes || []) {
      if (echo.from !== D.id || own(st.echoes, echo.id)) continue;
      for (const item of echo.derive || []) {
        if (evalWhen(item.when, st, D)) {
          st.echoes[echo.id] = item.value;
          break;
        }
      }
      if (!own(st.echoes, echo.id) && echo.default !== undefined) st.echoes[echo.id] = echo.default;
    }
    return st.echoes;
  }
  function sceneText(scene, st, D) {
    for (const variant of scene && scene.text_variants || []) {
      if (evalWhen(variant.when, st, D)) return variant.text;
    }
    const byEcho = echoText(scene && scene.text_by_echo, st);
    if (byEcho !== undefined) return byEcho;
    return scene && scene.text;
  }
  function echoText(mapping, st) {
    if (!mapping || typeof mapping !== "object") return undefined;
    for (const [echoId, options] of Object.entries(mapping)) {
      if (!options || typeof options !== "object") continue;
      const value = (st.echoes || {})[echoId];
      if (own(options, value)) return options[value];
      if (own(options, "_")) return options._;
    }
    return undefined;
  }
  function choiceResult(choice, st, D) {
    for (const variant of Array.isArray(choice && choice.result_variants) ? choice.result_variants : []) {
      if (variant && typeof variant === "object" && evalWhen(variant.when, st, D)) return variant.text;
    }
    const byEcho = echoText(choice && choice.result_by_echo, st);
    return byEcho === undefined ? (choice && choice.result) : byEcho;
  }
  const blank = text => !text || /^[\s…\.。]*$/.test(String(text));
  function ending(D, st, options) {
    options = options || {};
    const endings = D.endings || [];
    if (!endings.length) return null;
    const byId = Object.fromEntries(endings.map(item => [item.id, item]));
    const hit = endings.find(item => evalWhen(item.when, st, D));
    if (!hit) return null;
    const base = hit.same_as && byId[hit.same_as] || hit;
    let high = null;
    let review = base.review;
    if (base.variant !== undefined) {
      high = evalWhen(base.variant, st, D);
      review = (high ? base.review_high : base.review_low) ?? base.review;
    }
    const missedVariants = base.missed_variants || (base.review && base.review.missed_variants) ||
      (review && typeof review === "object" && review.missed_variants);
    if (Array.isArray(missedVariants)) {
      const hitVariant = missedVariants.find(variant => variant && typeof variant === "object" && evalWhen(variant.when, st, D));
      const hitText = hitVariant && (hitVariant.text !== undefined ? hitVariant.text : hitVariant.missed);
      if (hitText !== undefined) {
        const missed = Array.isArray(hitText) ? clone(hitText) : [hitText];
        review = Object.assign({}, review && typeof review === "object" && !Array.isArray(review) ? review : {}, { missed });
      }
    }
    if (review && typeof review === "object" && !Array.isArray(review) && own(review, "missed_variants")) {
      review = Object.assign({}, review);
      delete review.missed_variants;
    }
    const result = {
      id: hit.id,
      shown: base.id,
      title: base.title,
      text: base.text,
      image: base.image,
      review: blank(review) ? null : review,
      high,
      selves: []
    };
    if (options.includeSelf === true) {
      result.selves = (D.self_endings || []).filter(item => evalWhen(item.when, st, D)).map(item => item.id);
      result.selfEndingDefs = (D.self_endings || []).filter(item => result.selves.includes(item.id));
    }
    return result;
  }

  function carryValues(previous, chapter) {
    previous = previous || {};
    const defaults = (chapter.values_in || {}).defaults || {};
    const carry = (chapter.values_in || {}).carry || {};
    const values = {};
    for (const [key, rawDefault] of Object.entries(defaults)) {
      const init = rawDefault && typeof rawDefault === "object" ? rawDefault.init : rawDefault;
      const rule = carry[key];
      if (rule === "keep" && own(previous, key)) values[key] = Number(previous[key]);
      else if (rule && typeof rule === "object") {
        let value = Number(own(previous, key) ? previous[key] : init || 0) + Number(rule.add || 0);
        if (rule.min !== undefined) value = Math.max(Number(rule.min), value);
        if (rule.max !== undefined) value = Math.min(Number(rule.max), value);
        values[key] = value;
      } else values[key] = init === undefined ? 0 : init;
      if (rawDefault && typeof rawDefault === "object") {
        if (rawDefault.min !== undefined) values[key] = Math.max(Number(rawDefault.min), values[key]);
        if (rawDefault.max !== undefined) values[key] = Math.min(Number(rawDefault.max), values[key]);
      }
    }
    return values;
  }
  function newArchive() {
    return {
      schemaVersion: 3,
      settings: { fontSize: 2, reducedMotion: false, audio: false, showKey: false },
      unlocked: ["c1"],
      mainline: { c1: null, c2: null, c3: null, c4: null, fin: null },
      runs: {},
      collection: { endings: { c1: [], c2: [], c3: [], c4: [], fin: [] }, selfEndings: [], echoesSeen: [] },
      inProgress: null
    };
  }
  function outputsDiffer(oldRun, newRun) {
    const cleanFlags = value => [...(value || [])].sort();
    return JSON.stringify(oldRun && oldRun.echoesOut || {}) !== JSON.stringify(newRun && newRun.echoesOut || {}) ||
      JSON.stringify(cleanFlags(oldRun && oldRun.flagsOut)) !== JSON.stringify(cleanFlags(newRun && newRun.flagsOut));
  }
  function completeRun(archive, runId, decision, chapterOrder) {
    const run = archive.runs[runId];
    if (!run) return { archive, wroteMainline: false, stale: [] };
    const chapter = run.chapter;
    archive.mainline = archive.mainline || {};
    archive.unlocked = archive.unlocked || ["c1"];
    const previousId = archive.mainline[chapter];
    const first = !previousId;
    // First clear writes automatically. A replay without an explicit choice is archive-only.
    const writeMainline = first || decision === "mainline";
    const stale = [];
    if (writeMainline) {
      const previous = previousId && archive.runs[previousId];
      archive.mainline[chapter] = runId;
      run.inMainline = true;
      run.stale = false;
      if (previous && outputsDiffer(previous, run)) {
        const index = (chapterOrder || []).indexOf(chapter);
        for (const later of (chapterOrder || []).slice(index + 1)) {
          const laterId = archive.mainline[later];
          if (laterId && archive.runs[laterId]) {
            archive.runs[laterId].stale = true;
            stale.push(later);
          }
        }
      }
      const index = (chapterOrder || []).indexOf(chapter);
      const next = (chapterOrder || [])[index + 1];
      if (next && !archive.unlocked.includes(next)) archive.unlocked.push(next);
    } else {
      run.inMainline = false;
    }
    run.stale = run.stale || false;
    archive.inProgress = null;
    return { archive, wroteMainline: writeMainline, stale };
  }
  function migrateLegacy(archive, legacy, timestamp) {
    archive = archive && archive.schemaVersion === 3 ? archive : newArchive();
    if (!legacy || typeof legacy !== "object" || !legacy.scene) return archive;
    const sequence = Object.keys(archive.runs || {}).length + 1;
    const runId = "run_migrated_c1_" + String(sequence).padStart(3, "0");
    const state = clone(legacy);
    archive.runs[runId] = {
      chapter: "c1", startedAt: timestamp || new Date().toISOString(), finishedAt: null,
      source: "legacy:cx_save", valuesIn: {}, valuesOut: clone(legacy.vals || {}),
      echoesIn: {}, echoesOut: {}, flagsOut: clone(legacy.flags || []), bonuses: clone(legacy.bonuses || []),
      ending: null, selfEnding: null, log: clone(legacy.log || []), curve: [], checkpoints: {},
      stale: false, inMainline: false, migrated: true
    };
    archive.unlocked = [...new Set([...(archive.unlocked || []), "c1"])];
    archive.inProgress = { run: runId, scene: legacy.scene, state };
    return archive;
  }
  function defaultReplayDestination() { return "archive"; }
  function validateEchoSets(D) {
    const errors = [];
    const echoDefs = Object.fromEntries((D.echoes || []).map(item => [item.id, item]));
    for (const scene of D.scenes || []) for (const choice of scene.choices || []) {
      if (!choice.echo_set) continue;
      if (!choice.key) errors.push(choice.id + ": echo_set 要求 key:true");
      for (const [id, value] of Object.entries(choice.echo_set)) {
        if (!echoDefs[id]) errors.push(choice.id + ": 未登记回响 " + id);
        else if (!(echoDefs[id].values || []).includes(value)) errors.push(choice.id + ": 无效回响值 " + id + "=" + value);
      }
    }
    return errors;
  }

  G.Engine = {
    initState, defaultValues, hm, apply, evalWhen, resolvePortrait, visibleChoices, ending, checkBonuses,
    clone, blank, deriveEchoes, sceneText, choiceResult, carryValues, newArchive, completeRun,
    migrateLegacy, defaultReplayDestination, validateEchoSets, clampValue
  };
})(typeof window !== "undefined" ? window : globalThis);
if (typeof module !== "undefined") module.exports = globalThis.Engine;
