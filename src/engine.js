export const VERSION = 2;
export const clone = (v) => structuredClone(v);
export function newState(story) {
  return {
    version: VERSION,
    scene: story.chapters[0].entry,
    beat: 0,
    chapter: "c1",
    values: { trust: 0, zhou: 0, self: 0 },
    flags: {},
    evidence: [],
    echoes: [],
    history: [],
    checkpoints: {},
    path: [],
    choices: [],
    ending: null,
    startedAt: Date.now(),
    lastSaved: Date.now(),
  };
}
export function matches(rule, state) {
  if (!rule) return true;
  if (rule.all) return rule.all.every((r) => matches(r, state));
  if (rule.any) return rule.any.some((r) => matches(r, state));
  if (rule.not) return !matches(rule.not, state);
  if (rule.flag) return state.flags[rule.flag] === (rule.value ?? true);
  if (rule.evidence) return state.evidence.includes(rule.evidence);
  if (rule.minEvidence !== undefined)
    return state.evidence.length >= rule.minEvidence;
  if (rule.stat) return (state.values[rule.stat] || 0) >= rule.min;
  return false;
}
export function visibleBeats(scene, state) {
  return scene.beats.filter((b) => matches(b.when, state));
}
export function visibleChoices(scene, state) {
  return (scene.choices || []).filter((c) => matches(c.when, state));
}
export function resolveNext(target, state) {
  if (typeof target === "string") return target;
  if (Array.isArray(target))
    return target.find((t) => matches(t.when, state))?.to;
  return null;
}
export function applyChoice(state, choice) {
  const next = clone(state);
  for (const [key, value] of Object.entries(choice.changes || {}))
    next.values[key] = (next.values[key] || 0) + value;
  Object.assign(next.flags, choice.flags || {});
  next.evidence = [...new Set([...next.evidence, ...(choice.evidence || [])])];
  if (choice.discardEvidence)
    next.evidence = next.evidence.filter(
      (id) => !choice.discardEvidence.includes(id),
    );
  if (choice.echo && !next.echoes.includes(choice.echo))
    next.echoes.push(choice.echo);
  next.choices.push({ scene: state.scene, id: choice.id, text: choice.text });
  next.scene = resolveNext(choice.next, next);
  next.beat = 0;
  next.lastSaved = Date.now();
  return next;
}
export function enterScene(state, scene, chapter) {
  if (!scene) throw new Error("场景不存在：" + state.scene);
  state.chapter = chapter.id;
  if (!state.checkpoints[chapter.id])
    state.checkpoints[chapter.id] = snapshot(state);
  if (scene.grant)
    state.evidence = [...new Set([...state.evidence, ...scene.grant])];
  if (scene.setFlags) Object.assign(state.flags, scene.setFlags);
  state.path = state.path || [];
  if (state.path.at(-1) !== scene.id) state.path.push(scene.id);
}
export function snapshot(state) {
  const out = clone(state);
  out.checkpoints = {};
  out.history = [];
  return out;
}
export { validateSave } from "./save-validation.js";
export function beatText(beat, state) {
  return beat.variants?.find((v) => matches(v.when, state))?.text ?? beat.text;
}
export function chapterFor(story, sceneId) {
  return story.chapters.find((c) => c.scenes.includes(sceneId));
}
