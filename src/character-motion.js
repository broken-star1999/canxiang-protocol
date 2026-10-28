/* Character direction is presentation only; it never writes to story or saves. */
export const CHARACTER_CUES = Object.freeze({
  hesitate: "guarded",
  recoil: "withdrawn",
  admit: "open",
  resolve: "open",
  desync: "guarded",
  farewell: "near",
  shutdown: "offline",
  restore: "formal",
  settle: "neutral",
  hold: "neutral",
});

export function characterDirection(id, emotion, stage, context = {}) {
  let idle = id;
  let stance = "neutral";
  if (emotion === "concern" || emotion === "evasive") stance = "guarded";
  if (emotion === "hurt" || emotion === "shock") stance = "withdrawn";
  if (["admit", "accept", "relief"].includes(emotion)) stance = "open";
  if (id === "lin" && context.costume === "medical") idle = "medical";
  if (id === "zhou" && context.wounded) idle = "wounded";
  if (id === "mira" && emotion === "reset") {
    idle = "still";
    stance = "formal";
  }
  if (Object.hasOwn(CHARACTER_CUES, stage)) {
    stance = CHARACTER_CUES[stage];
    if (["shutdown", "restore", "hold"].includes(stage)) idle = "still";
  }
  return { idle, stance };
}

const reactions = {
  hesitate: {
    duration: 1100,
    frames: [
      { transform: "translateY(0)" },
      { transform: "translateY(2px)", offset: 0.35 },
      { transform: "translateY(2px)", offset: 0.7 },
      { transform: "translateY(0)" },
    ],
  },
  recoil: {
    duration: 760,
    frames: [
      { transform: "translateY(0)" },
      { transform: "translateY(3px) scale(.987)", offset: 0.25 },
      { transform: "translateY(0)" },
    ],
  },
  admit: {
    duration: 1300,
    frames: [
      { transform: "translateY(3px)", offset: 0 },
      { transform: "translateY(3px)", offset: 0.3 },
      { transform: "translateY(-1px)", offset: 0.8 },
      { transform: "translateY(0)" },
    ],
  },
  resolve: {
    duration: 850,
    frames: [
      { transform: "translateY(2px) scale(.996)" },
      { transform: "translateY(0) scale(1)" },
    ],
  },
  desync: {
    duration: 1350,
    frames: [
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0.82, transform: "translateX(3px)", offset: 0.18 },
      { opacity: 0.95, transform: "translateX(-2px)", offset: 0.32 },
      { opacity: 0.9, transform: "translateX(1px)", offset: 0.55 },
      { opacity: 1, transform: "translateX(0)" },
    ],
  },
  farewell: {
    duration: 1800,
    frames: [
      { transform: "translateY(1px)", opacity: 1 },
      { transform: "translateY(-2px)", opacity: 0.92, offset: 0.65 },
      { transform: "translateY(0)", opacity: 1 },
    ],
  },
  restore: {
    duration: 900,
    frames: [{ opacity: 0 }, { opacity: 1 }],
  },
};

export class CharacterMotion {
  constructor(root, effects) {
    this.root = root;
    this.effects = effects;
    this.records = new Map();
    this.abort = new AbortController();
    this.disposed = false;
    this.observer = new MutationObserver(() => this.sync());
    for (const [selector, attributes] of [
      ["body", ["class", "data-view"]],
      ["#panel", ["open"]],
      ["#confirm", ["open"]],
      ["#chapterCurtain", ["hidden"]],
      ["#endingScreen", ["hidden"]],
    ]) {
      const target = document.querySelector(selector);
      if (target)
        this.observer.observe(target, { attributes: true, attributeFilter: attributes });
    }
    document.addEventListener("visibilitychange", () => this.sync(), {
      signal: this.abort.signal,
    });
    this.sync();
  }
  blocked() {
    return (
      this.disposed ||
      this.effects.reduced() ||
      document.hidden ||
      document.body.dataset.view !== "game" ||
      document.body.classList.contains("reading-skip") ||
      document.body.classList.contains("cg-active") ||
      document.querySelector("#panel").open ||
      document.querySelector("#confirm").open ||
      !document.querySelector("#chapterCurtain").hidden ||
      !document.querySelector("#endingScreen").hidden
    );
  }
  sync() {
    const paused = this.blocked();
    this.root.dataset.performance = paused ? "paused" : "running";
    if (paused)
      for (const record of this.records.values()) {
        record.animation?.cancel();
        record.animation = null;
      }
  }
  present(slot, direction, key, cue) {
    if (this.disposed) return;
    slot.dataset.idle = direction.idle;
    slot.dataset.stance = direction.stance;
    const previous = this.records.get(slot);
    if (previous?.key === key) return;
    previous?.animation?.cancel();
    const record = { key, animation: null };
    this.records.set(slot, record);
    this.sync();
    const reaction = reactions[cue];
    if (!reaction || this.blocked()) return;
    const animation = this.effects.animate(
      slot.querySelector(".portrait-performance"),
      reaction.frames,
      { duration: reaction.duration, easing: "ease-in-out" },
    );
    record.animation = animation;
    const finish = () => {
      if (record.animation === animation) record.animation = null;
    };
    animation?.finished.then(finish, finish);
  }
  clear() {
    for (const [slot, record] of this.records) {
      record.animation?.cancel();
      delete slot.dataset.idle;
      delete slot.dataset.stance;
    }
    this.records.clear();
    this.sync();
  }
  dispose() {
    this.disposed = true;
    this.abort.abort();
    this.observer.disconnect();
    this.clear();
  }
}
