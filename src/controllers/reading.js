import { $, reduced, characterIds } from "../ui/dom.js";
import { visibleChoices, beatText } from "../engine.js?v=4";

export class ReadingController {
  constructor(game) {
    this.game = game;
  }
  stopReading() {
    cancelAnimationFrame(this.game.frame);
    clearTimeout(this.game.autoTimer);
    clearInterval(this.game.timer);
    this.game.frame = null;
    this.game.timer = null;
  }
  stopModes() {
    this.game.auto = this.game.skip = false;
    this.game.updateModes();
    clearTimeout(this.game.autoTimer);
  }
  updateModes() {
    $("#autoButton").setAttribute("aria-pressed", this.game.auto);
    $("#skipButton").setAttribute("aria-pressed", this.game.skip);
  }
  renderBeat() {
    this.game.stopReading();
    if (this.game.curtain || this.game.view !== "game") return;
    const beats = this.game.beats();
    if (this.game.state.beat >= beats.length) {
      this.game.finishScene();
      return;
    }
    this.game.inChoice = false;
    $("#choiceArea").hidden = true;
    $("#dialogueArea").hidden = false;
    const beat = beats[this.game.state.beat];
    this.game.renderVisual(beat);
    this.game.cast(beat);
    this.game.effects.speaker(
      characterIds[beat.speaker] || "narrator",
      this.game.lastSpeaker !== beat.speaker,
    );
    this.game.lastSpeaker = beat.speaker;
    $("#speaker").textContent =
      beat.speaker === "旁白" ? "雾岬站" : beat.speaker;
    $("#speaker").classList.toggle("narrator", beat.speaker === "旁白");
    $("#readProgress").textContent =
      `${this.game.scene().time} / ${this.game.saves.data.collection.read.includes(this.game.readId()) ? "已读" : "初见"}`;
    this.game.currentText = beatText(beat, this.game.state);
    this.game.currentReadId = this.game.readId();
    const item = {
      scene: this.game.state.scene,
      beat: this.game.state.beat,
      speaker: beat.speaker,
      text: beatText(beat, this.game.state),
      time: this.game.scene().time,
    };
    const last = this.game.state.history.at(-1);
    if (last?.scene !== item.scene || last?.beat !== item.beat)
      this.game.state.history.push(item);
    if (this.game.state.history.length > 1500) this.game.state.history.shift();
    this.game.save();
    const known = this.game.saves.data.collection.read.includes(
      this.game.currentReadId,
    );
    if (this.game.skip && !known) {
      this.game.skip = false;
      this.game.updateModes();
      this.game.toast("已到未读内容，快进已停止。");
    }
    if (
      !this.game.settings.speed ||
      this.game.settings.reduced ||
      reduced() ||
      this.game.skip
    ) {
      $("#dialogueText").textContent = this.game.currentText;
      this.game.typing = false;
      this.game.completeTyping();
    } else {
      this.game.typing = true;
      $("#nextIndicator").hidden = true;
      $("#dialogueText").textContent = "";
      const start = performance.now();
      const type = (now) => {
        const n = Math.floor(((now - start) * this.game.settings.speed) / 1000);
        $("#dialogueText").textContent = this.game.currentText.slice(0, n);
        if (n >= this.game.currentText.length) {
          this.game.typing = false;
          this.game.completeTyping();
        } else this.game.frame = requestAnimationFrame(type);
      };
      this.game.frame = requestAnimationFrame(type);
    }
  }
  completeTyping() {
    this.game.typing = false;
    $("#nextIndicator").hidden = false;
    const read = this.game.saves.data.collection.read;
    if (!read.includes(this.game.currentReadId))
      read.push(this.game.currentReadId);
    this.game.saves.write();
    this.game.scheduleAdvance();
  }
  reveal() {
    cancelAnimationFrame(this.game.frame);
    $("#dialogueText").textContent = this.game.currentText;
    this.game.completeTyping();
  }
  blocked() {
    return (
      $("#panel").open ||
      $("#confirm").open ||
      document.hidden ||
      this.game.curtain ||
      this.game.inChoice ||
      this.game.view !== "game" ||
      $("#endingScreen").hidden === false
    );
  }
  scheduleAdvance() {
    clearTimeout(this.game.autoTimer);
    if (this.game.blocked() || this.game.typing) return;
    if (this.game.skip)
      this.game.autoTimer = setTimeout(() => this.game.advance(), 90);
    else if (this.game.auto)
      this.game.autoTimer = setTimeout(
        () => this.game.advance(),
        this.game.settings.auto + this.game.currentText.length * 22,
      );
  }
  advance() {
    if (this.game.blocked()) return;
    if (this.game.typing) {
      this.game.reveal();
      return;
    }
    this.game.sound.click();
    this.game.state.beat++;
    this.game.renderBeat();
  }
  runChoiceTimer() {
    clearInterval(this.game.timer);
    this.game.timerStamp = performance.now();
    this.game.timer = setInterval(() => {
      const now = performance.now();
      if (
        this.game.settings.timed &&
        !$("#panel").open &&
        !$("#confirm").open &&
        !document.hidden
      )
        this.game.choiceRemaining -= (now - this.game.timerStamp) / 1000;
      this.game.timerStamp = now;
      $("#choiceTimer i").style.width =
        Math.max(
          0,
          (this.game.choiceRemaining / this.game.scene().timer.seconds) * 100,
        ) + "%";
      $("#choiceTimer span").textContent =
        `${Math.max(0, Math.ceil(this.game.choiceRemaining))} 秒 · 超时优先救援`;
      if (this.game.choiceRemaining <= 0) {
        const c = visibleChoices(this.game.scene(), this.game.state).find(
          (c) => c.id === this.game.scene().timer.fallback,
        );
        this.game.choose(c);
      }
    }, 100);
  }
}
