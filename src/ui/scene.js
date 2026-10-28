import { $, musicMood, characterIds } from "../ui/dom.js";

import { portraitFor } from "../presentation.js?v=4";

export class SceneView {
  constructor(game) {
    this.game = game;
  }
  preload(bg) {
    const image = new Image();
    image.src = this.game.art.backgrounds[bg];
  }
  backdrop(bg) {
    if (this.game.lastBg === bg) return;
    this.game.lastBg = bg;
    document.body.dataset.environment = bg;
    this.game.bgSlot = 1 - this.game.bgSlot;
    const front = $(this.game.bgSlot ? "#backdropB" : "#backdropA"),
      back = $(this.game.bgSlot ? "#backdropA" : "#backdropB");
    front.style.backgroundImage = `url("${this.game.art.backgrounds[bg]}")`;
    front.classList.add("active");
    back.classList.remove("active");
    this.game.sound.play(musicMood(bg));
  }
  cast(beat) {
    if (beat.cg) {
      document
        .querySelectorAll(".sprite")
        .forEach((n) => n.classList.remove("visible"));
      $("#communication").hidden = true;
      return;
    }
    const chars = {};
    const seen = this.game.beats().slice(0, this.game.state.beat + 1);
    for (const b of seen) {
      const id = characterIds[b.speaker];
      if (id) chars[id] = b.emotion;
    }
    for (const id of beat.hideCharacters || []) delete chars[id];
    const active = characterIds[beat.speaker];
    let left = chars.lin ? "lin" : chars.zhou ? "zhou" : null;
    if (chars.zhou && active === "zhou") left = "zhou";
    const center = chars.tang ? "tang" : null;
    const roster = {
      Left: center ? null : left,
      Right: center ? null : chars.mira ? "mira" : null,
      Center: center,
    };
    $("#cast").classList.toggle("dual", !!(roster.Left && roster.Right));
    for (const [slot, id] of Object.entries(roster)) {
      const el = $("#sprite" + slot);
      el.classList.toggle("visible", !!id);
      el.classList.toggle("speaking", id === active || beat.speaker === "旁白");
      if (id) {
        const mood = chars[id] || "neutral";
        const src = portraitFor(
          this.game.art,
          this.game.scene(),
          this.game.state,
          id,
          mood,
        );
        el.classList.toggle(
          "remote",
          (id === "lin" && this.game.scene().costumes?.lin === "medical") ||
            (id === "tang" && !this.game.scene().inPerson),
        );
        el.classList.toggle("terminal", id === "mira");
        el.dataset.character = id;
        this.game.effects.portrait(el, src, id);
      }
    }
    const message =
      beat.communication ||
      this.game.scene().communication ||
      (center && !this.game.scene().inPerson ? "远程通信 · 唐棠" : null);
    $("#communication").hidden = !message;
    $("#communication").textContent = "● " + (message || "");
  }
  clearCG() {
    document.body.classList.remove("cg-active");
    $("#eventCG").hidden = true;
    $("#cgView").hidden = true;
    $("#eventCG").dataset.key = "";
  }
  renderVisual(beat) {
    this.game.backdrop(beat.background || this.game.scene().bg);
    $("#place").textContent = beat.location || this.game.scene().location;
    const key = beat.cg;
    if (!key) {
      this.game.clearCG();
      return;
    }
    const art = this.game.art.cgs[key],
      area = $("#eventCG"),
      img = $("#eventCGImage");
    document.body.classList.add("cg-active");
    $("#cgView").hidden = false;
    area.hidden = false;
    if (area.dataset.key === key) return;
    area.dataset.key = key;
    area.style.backgroundImage = `url("${art.image}")`;
    img.alt = art.text;
    img.src = art.image;
    const show = () => {
      if (area.dataset.key === key && !area.hidden)
        this.game.effects.animate(area, [{ opacity: 0 }, { opacity: 1 }], {
          duration: 650,
        });
    };
    if (img.complete && img.naturalWidth) show();
    else img.onload = show;
  }
  unhide() {
    document.body.classList.remove("ui-hidden");
    $("#restoreUI").hidden = true;
  }
  hide() {
    if (this.game.inChoice || this.game.curtain || !$("#endingScreen").hidden)
      return;
    const hidden = document.body.classList.toggle("ui-hidden");
    $("#dialogueArea").hidden = hidden;
    $("#restoreUI").hidden = !hidden;
  }
}
