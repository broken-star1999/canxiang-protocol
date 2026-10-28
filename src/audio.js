/* Original procedural score and effects. No downloaded music or runtime CDN. */
export class Sound {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.voices = new Set();
    this.mode = null;
    this.lastPhraseTime = -Infinity;
  }
  connect(ctx) {
    this.ctx = ctx;
    this.music = ctx.createGain();
    this.effects = ctx.createGain();
    this.music.gain.value = 0;
    this.effects.gain.value = 0;
    this.master = ctx.createDynamicsCompressor();
    this.master.threshold.value = -10;
    this.master.knee.value = 12;
    this.master.ratio.value = 3;
    this.master.attack.value = 0.015;
    this.master.release.value = 0.22;
    this.music.connect(this.master);
    this.effects.connect(this.master);
    this.master.connect(ctx.destination);
  }
  async unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.connect(new C());
    }
    const wasPaused = this.ctx.state !== "running";
    try {
      await this.ctx.resume();
      this.volume();
      if (wasPaused && this.ctx.state === "running" && this.phrase) {
        clearInterval(this.interval);
        this.phrase();
        this.interval = setInterval(this.phrase, 8000);
      }
    } catch {}
  }
  volume() {
    if (!this.ctx) return;
    const level = (k) =>
      Math.max(0, Math.min(1, Number(this.settings[k]) || 0));
    const music = level("music") * 3.2,
      effects = level("sfx") * 0.4;
    this.music.gain.setTargetAtTime(
      music,
      this.ctx.currentTime,
      music === 0 ? 0.025 : 0.15,
    );
    this.effects.gain.setTargetAtTime(effects, this.ctx.currentTime, 0.03);
  }
  tone(
    freq,
    start,
    duration,
    gain = 0.1,
    type = "sine",
    destination = this.music,
  ) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(destination);
    g.gain.value = 0;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    o.start(start);
    o.stop(start + duration + 0.1);
    const voice = { osc: o, gain: g };
    if (destination === this.music) this.voices.add(voice);
    o.onended = () => {
      this.voices.delete(voice);
      o.disconnect();
      g.disconnect();
    };
  }
  fadeScore() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const { osc, gain } of this.voices) {
      const param = gain.gain;
      if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t);
      else {
        const value = param.value;
        param.cancelScheduledValues(t);
        param.setValueAtTime(value, t);
      }
      param.linearRampToValueAtTime(0, t + 0.15);
      try {
        osc.stop(t + 0.18);
      } catch {}
    }
  }
  play(mode) {
    if (!this.ctx) return;
    this.volume();
    if (this.mode === mode) return;
    this.fadeScore();
    this.mode = mode;
    this.lastPhraseTime = -Infinity;
    clearInterval(this.interval);
    const themes = {
      cold: [
        [146.83, 220, 293.66],
        [130.81, 196, 261.63],
        [164.81, 220, 329.63],
        [146.83, 196, 293.66],
      ],
      warm: [
        [174.61, 220, 261.63],
        [164.81, 196, 261.63],
        [146.83, 220, 293.66],
        [196, 246.94, 293.66],
      ],
      dawn: [
        [130.81, 196, 261.63],
        [174.61, 220, 349.23],
        [164.81, 246.94, 329.63],
        [146.83, 220, 293.66],
      ],
    };
    const chords = themes[mode] || themes.cold;
    let bar = 0;
    this.phrase = () => {
      if (
        this.ctx.state !== "running" ||
        this.ctx.currentTime - this.lastPhraseTime < 0.08
      )
        return;
      this.lastPhraseTime = this.ctx.currentTime;
      const t = this.ctx.currentTime + 0.04,
        notes = chords[bar++ % 4];
      notes.forEach((n, i) => {
        this.tone(n / 2, t, 7, 0.035);
        this.tone(n, t + i * 0.08, 6, 0.02);
        this.tone(n * 2, t + 1 + i * 1.2, 3, 0.045, "sine");
      });
    };
    this.phrase();
    this.interval = setInterval(this.phrase, 8000);
  }
  click() {
    if (this.ctx?.state === "running")
      this.tone(760, this.ctx.currentTime, 0.07, 0.025, "sine", this.effects);
  }
  ui() {
    if (this.ctx?.state === "running")
      this.tone(1046, this.ctx.currentTime, 0.09, 0.018, "sine", this.effects);
  }
  signal() {
    if (!this.ctx) return;
    [0, 0.18, 0.4].forEach((d, i) =>
      this.tone(
        [523.25, 659.25, 783.99][i],
        this.ctx.currentTime + d,
        0.4,
        0.065,
        "sine",
        this.effects,
      ),
    );
  }
  pause() {
    this.ctx?.suspend().catch(() => {});
  }
}
