// Shared browser/Node game logic.
(function (G) {
  const clone = o => JSON.parse(JSON.stringify(o));
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);
  const warned = new Set();
  const parsed = new Map();
  const BAD = {};

  function warnOnce(key, message) {
    if (warned.has(key)) return;
    warned.add(key);
    if (typeof console !== "undefined" && console.warn) console.warn(message);
  }

  function valueConfig(D, key) {
    const v = (D.values || {})[key];
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  }

  function clampValue(D, key, value) {
    const config = valueConfig(D, key);
    let n = Number(value);
    if (!Number.isFinite(n)) n = 0;
    if (config && config.min !== undefined) n = Math.max(Number(config.min), n);
    if (config && config.max !== undefined) n = Math.min(Number(config.max), n);
    return n;
  }

  function initState(D) {
    const vals = {};
    for (const [key, raw] of Object.entries(D.values || {})) {
      const init = raw && typeof raw === "object" && !Array.isArray(raw) ? raw.init : raw;
      vals[key] = clampValue(D, key, init === undefined ? 0 : init);
    }
    return {
      scene: D.scenes[0].id,
      vals,
      flags: [],
      mins: 0,
      log: [],
      keys: [],
      bonuses: []
    };
  }

  function hm(start, m) {
    const [h, mm] = (start || "00:00").split(":").map(Number);
    const t = h * 60 + mm + m;
    return String(Math.floor(t / 60) % 24).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  }

  function tokenize(source) {
    const tokens = [];
    const re = /\s*(>=|<=|==|!=|&&|\|\||[()!<>\[\],]|:|(?:\d+(?:\.\d*)?|\.\d+)|[A-Za-z_][A-Za-z0-9_.-]*)/y;
    let i = 0;
    while (i < source.length) {
      if (!source.slice(i).trim()) break;
      re.lastIndex = i;
      const m = re.exec(source);
      if (!m) throw new Error("无效字符");
      tokens.push(m[1]);
      i = re.lastIndex;
    }
    return tokens;
  }

  function parseExpression(source) {
    const tokens = tokenize(source);
    let i = 0;
    const peek = () => tokens[i];
    const take = t => {
      if (tokens[i] !== t) throw new Error("缺少 " + t);
      i++;
    };
    const parsePrimary = () => {
      const t = peek();
      if (t === undefined) throw new Error("缺少条件");
      if (t === "(") {
        i++;
        const node = parseOr();
        take(")");
        return node;
      }
      if (t === "flag") {
        i++;
        take(":");
        const name = peek();
        if (!name || !/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name)) throw new Error("flag 名无效");
        i++;
        return { type: "flag", name };
      }
      if (t === "true" || t === "false") {
        i++;
        return { type: "literal", value: t === "true" };
      }
      if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t)) {
        i++;
        return { type: "literal", value: Number(t) };
      }
      if (/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(t)) {
        i++;
        return { type: "name", name: t };
      }
      throw new Error("条件项无效");
    };
    const parseComparison = () => {
      const left = parsePrimary();
      if (peek() === "in") {
        i++;
        take("[");
        const items = [];
        if (peek() !== "]") {
          while (true) {
            items.push(parsePrimary());
            if (peek() !== ",") break;
            i++;
          }
        }
        take("]");
        return { type: "in", left, items };
      }
      if ([">", ">=", "<", "<=", "==", "!="].includes(peek())) {
        const op = tokens[i++];
        return { type: "compare", op, left, right: parsePrimary() };
      }
      return { type: "truthy", value: left };
    };
    const parseUnary = () => {
      if (peek() === "!") {
        i++;
        return { type: "not", value: parseUnary() };
      }
      return parseComparison();
    };
    const parseAnd = () => {
      let node = parseUnary();
      while (peek() === "&&") {
        i++;
        node = { type: "and", left: node, right: parseUnary() };
      }
      return node;
    };
    const parseOr = () => {
      let node = parseAnd();
      while (peek() === "||") {
        i++;
        node = { type: "or", left: node, right: parseAnd() };
      }
      return node;
    };
    const ast = parseOr();
    if (i !== tokens.length) throw new Error("条件末尾有多余内容");
    return ast;
  }

  function conditionKey(condition) {
    try { return JSON.stringify(condition); }
    catch (_) { return String(condition); }
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

  function resolve(node, st) {
    if (node.type === "literal") return node.value;
    if (node.type === "flag") return (st.flags || []).includes(node.name);
    if (node.type === "name") {
      if (own(st.vals, node.name)) return Number(st.vals[node.name]);
      return { symbol: node.name, unresolved: true };
    }
    return undefined;
  }

  function isUnresolvedName(node, st) {
    return node && node.type === "name" && !own(st.vals, node.name);
  }

  function comparableEqual(a, b) {
    if (typeof a === "number" && typeof b === "number") return a === b;
    if (typeof a === "boolean" && typeof b === "boolean") return a === b;
    if (a && b && a.unresolved && b.unresolved) return a.symbol === b.symbol;
    return false;
  }

  function compare(node, st) {
    const a = resolve(node.left, st);
    const b = resolve(node.right, st);
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

  function evalAst(node, st) {
    switch (node.type) {
      case "literal": return !!node.value;
      case "flag": return (st.flags || []).includes(node.name);
      case "truthy": {
        const value = resolve(node.value, st);
        return typeof value === "number" ? value !== 0 : typeof value === "boolean" ? value : false;
      }
      case "not": return !evalAst(node.value, st);
      case "and": return evalAst(node.left, st) && evalAst(node.right, st);
      case "or": return evalAst(node.left, st) || evalAst(node.right, st);
      case "compare": return compare(node, st);
      case "in": {
        if (isUnresolvedName(node.left, st)) {
          return node.items.some(item => {
            const value = resolve(item, st);
            if (value && value.unresolved) return (st.flags || []).includes(node.left.name + "=" + value.symbol);
            return (st.flags || []).includes(node.left.name + "=" + String(value));
          });
        }
        const left = resolve(node.left, st);
        return node.items.some(item => comparableEqual(left, resolve(item, st)));
      }
      default: return false;
    }
  }

  function evalConditionObject(condition, st) {
    const keys = Object.keys(condition);
    if (!keys.length || keys.some(k => k !== "all" && k !== "any")) {
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
        return evalWhen(item, st);
      });
      if (key === "all" && !results.every(Boolean)) return false;
      if (key === "any" && !results.some(Boolean)) return false;
    }
    return true;
  }

  function evalWhen(condition, st) {
    if (condition === undefined || condition === null) return true;
    if (typeof condition === "boolean") return condition;
    if (typeof condition === "object" && !Array.isArray(condition)) return evalConditionObject(condition, st);
    if (typeof condition !== "string") {
      warnOnce("condition:" + conditionKey(condition), "条件格式无效，按 false 处理：" + conditionKey(condition));
      return false;
    }
    const ast = parseCached(condition);
    if (ast === BAD) return false;
    try { return !!evalAst(ast, st); }
    catch (_) {
      warnOnce("eval:" + condition, "条件求值失败，按 false 处理：" + condition);
      return false;
    }
  }

  function resolvePortrait(D, scene, st) {
    const original = scene && scene.portrait;
    if (!original) return original;
    for (const override of D.portrait_overrides || []) {
      if (override && override.from === original && evalWhen(override.when, st)) {
        return override.to;
      }
    }
    return original;
  }

  function flagList(value, field, choiceId) {
    if (value === undefined) return [];
    if (value === null) {
      warnOnce("flags:" + field + ":" + choiceId + ":null", field + " 格式无效，按不满足处理：" + choiceId);
      return null;
    }
    const list = Array.isArray(value) ? value : [value];
    if (list.every(x => typeof x === "string")) return list;
    warnOnce("flags:" + field + ":" + choiceId + ":" + conditionKey(value), field + " 格式无效，按不满足处理：" + choiceId);
    return null;
  }

  function visibleChoices(scene, st) {
    return (scene && scene.choices || []).filter(choice => {
      if (own(choice, "when") && !evalWhen(choice.when, st)) return false;
      if (own(choice, "requires")) {
        const required = flagList(choice.requires, "requires", choice.id);
        if (!required || !required.every(f => (st.flags || []).includes(f))) return false;
      }
      if (own(choice, "hide_if")) {
        const hidden = flagList(choice.hide_if, "hide_if", choice.id);
        if (!hidden || hidden.some(f => (st.flags || []).includes(f))) return false;
      }
      return true;
    });
  }

  function eff(st, effects, D) {
    for (const [key, value] of Object.entries(effects || {})) {
      st.vals[key] = clampValue(D || { values: {} }, key, Number(st.vals[key] || 0) + Number(value));
    }
  }

  function checkBonuses(D, st) {
    for (const bonus of D.bonuses || []) {
      if (bonus.once !== false && st.bonuses.includes(bonus.id)) continue;
      if (evalWhen(bonus.when, st)) {
        eff(st, bonus.effects, D);
        st.bonuses.push(bonus.id);
        st.log.push({ text: "［联动］" + (bonus.log || bonus.id), at: st.mins, bonus: true });
      }
    }
  }

  function apply(st, choice, D) {
    eff(st, choice.effects, D);
    for (const flag of choice.flags_set || []) {
      if (!st.flags.includes(flag)) st.flags.push(flag);
    }
    st.mins += Number(choice.time || 0);
    st.log.push({ text: String(choice.log || choice.label).replace(/^\d\d:\d\d\s*/, ""), at: st.mins, key: !!choice.key });
    if (choice.key) st.keys.push(choice.label);
    st.scene = choice.next;
    if (D) checkBonuses(D, st);
  }

  const blank = text => !text || /^[\s…\.。]*$/.test(String(text));

  function ending(D, st) {
    const endings = D.endings || [];
    if (!endings.length) return null;
    const byId = Object.fromEntries(endings.map(e => [e.id, e]));
    const hit = endings.find(e => evalWhen(e.when, st));
    if (!hit) return null;
    const base = hit.same_as && byId[hit.same_as] || hit;
    let high = null;
    let review = base.review;
    if (base.variant !== undefined) {
      high = evalWhen(base.variant, st);
      review = (high ? base.review_high : base.review_low) ?? base.review;
    }
    return {
      id: hit.id,
      shown: base.id,
      review: blank(review) ? null : review,
      high,
      selves: (D.self_endings || []).filter(s => evalWhen(s.when, st)).map(s => s.id)
    };
  }

  G.Engine = { initState, hm, apply, evalWhen, resolvePortrait, visibleChoices, ending, checkBonuses, clone, blank };
})(typeof window !== "undefined" ? window : globalThis);
if (typeof module !== "undefined") module.exports = globalThis.Engine;
