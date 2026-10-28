import {
  normalizeEnvelope,
  validatePoints,
  validateCollection,
  defaults,
} from "./save-validation.js";
export { defaults } from "./save-validation.js";
export const KEY = "canxiang:vn:v2";
export class Saves {
  constructor(story, storage) {
    this.story = story;
    try {
      this.storage = storage ?? globalThis.localStorage;
    } catch {
      this.storage = null;
    }
    this.raw = null;
    this.memory = false;
    this.data = {
      auto: null,
      slots: Array(6).fill(null),
      points: {},
      collection: {
        endings: [],
        evidence: [],
        echoes: [],
        read: [],
        chapters: [],
        nodes: [],
        edges: [],
      },
      settings: { ...defaults },
    };
    this.load();
  }
  load() {
    try {
      this.raw = this.storage.getItem(KEY);
      if (this.raw !== null)
        this.data = normalizeEnvelope(JSON.parse(this.raw), this.story);
    } catch {
      this.memory = true;
      this.error =
        this.raw !== null
          ? "浏览器存档无法读取。可导出原始存档以便恢复，旧数据未被覆盖。"
          : "浏览器存储不可用，本次进度可导出备份。";
    }
  }
  write() {
    if (this.memory) return false;
    try {
      this.storage.setItem(KEY, JSON.stringify({ format: 1, ...this.data }));
      return true;
    } catch (e) {
      this.memory = true;
      this.error = "浏览器存储不可用，请导出存档备份。";
      return false;
    }
  }
  save(state, slot = "auto") {
    const s = structuredClone(state);
    s.lastSaved = Date.now();
    if (slot === "auto") this.data.auto = s;
    else this.data.slots[slot] = s;
    this.collect(state);
    return this.write();
  }
  collect(s) {
    for (const k of ["evidence", "echoes"])
      this.data.collection[k] = [
        ...new Set([...this.data.collection[k], ...s[k]]),
      ];
    if (s.ending)
      this.data.collection.endings = [
        ...new Set([...this.data.collection.endings, s.ending]),
      ];
    if (!this.data.collection.chapters.includes(s.chapter))
      this.data.collection.chapters.push(s.chapter);
    this.data.collection.nodes = [
      ...new Set([...(this.data.collection.nodes || []), s.scene]),
    ];
    const path = s.path || [];
    this.data.collection.edges = [
      ...new Set([
        ...(this.data.collection.edges || []),
        ...path.slice(1).map((to, i) => path[i] + ">" + to),
      ]),
    ];
  }
  capture(s) {
    this.data.points = this.data.points || {};
    const saved = structuredClone(s);
    saved.beat = 0;
    saved.checkpoints = {};
    saved.history = saved.history.slice(-30);
    saved.ending = null;
    const key = JSON.stringify([
      saved.values,
      saved.flags,
      saved.evidence,
      saved.choices,
    ]);
    const variants = this.data.points[s.scene] || [];
    const filtered = variants.filter((x) => x.key !== key);
    filtered.push({ key, state: saved });
    this.data.points[s.scene] = filtered.slice(-3);
  }
  validatePoints(points) {
    return validatePoints(points, this.story);
  }
  validateCollection(collection) {
    return validateCollection(collection, this.story);
  }
  exportRaw() {
    return this.raw;
  }
  export() {
    return JSON.stringify(
      { game: "canxiang-vn", format: 1, ...this.data },
      null,
      2,
    );
  }
  import(text) {
    if (typeof text !== "string" || text.length > 5000000)
      throw Error("存档文件过大");
    const candidate = normalizeEnvelope(JSON.parse(text), this.story, {
      importing: true,
    });
    try {
      this.storage.setItem(KEY, JSON.stringify({ format: 1, ...candidate }));
    } catch {
      throw Error("导入未能保存，原进度未更改。请检查浏览器存储空间或权限。");
    }
    this.data = candidate;
    this.memory = false;
    this.raw = null;
    this.error = null;
    return true;
  }
}
