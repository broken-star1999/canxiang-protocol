import {
  matches,
  newState,
  visibleBeats,
  visibleChoices,
  resolveNext,
  applyChoice,
  enterScene,
  chapterFor,
  validateSave,
  clone,
} from "../engine.js?v=5";
import { Saves } from "../storage.js?v=5";
import { Sound } from "../audio.js?v=5";
import { Effects } from "../effects.js?v=5";
import { CharacterMotion } from "../character-motion.js?v=5";
import { openFlow } from "../flow.js?v=5";
import { $, node, button, reduced, musicMood } from "../ui/dom.js?v=5";
import { ReadingController } from "./reading.js?v=5";
import { InputBindings } from "./input.js?v=5";
import { SceneView } from "../ui/scene.js?v=5";
import { Panels } from "../ui/panels.js?v=5";

export class Game {
  constructor(story, art) {
    this.story = story;
    this.art = art;
    this.saves = new Saves(story);
    this.settings = this.saves.data.settings;
    this.sound = new Sound(this.settings);
    this.effects = new Effects(this.sound);
    this.motion = new CharacterMotion($("#cast"), this.effects);
    this.state = null;
    this.view = "title";
    this.typing = false;
    this.auto = false;
    this.skip = false;
    this.bgSlot = 0;
    this.frame = null;
    this.autoTimer = null;
    this.timer = null;
    this.choiceRemaining = 0;
    this.timerStamp = 0;
    this.inChoice = false;
    this.curtain = false;
    this.mode = null;
    this.lastBg = null;
    this.portraitCache = {};
    this.reading = new ReadingController(this);
    this.sceneView = new SceneView(this);
    this.panels = new Panels(this.panelContext());
    this.inputs = new InputBindings(this);
    this.inputs.mount();
    this.applySettings();
    $("#titleMira").src = art.characters.mira.neutral;
    this.showTitle();
    $("#loading").hidden = true;
    if (this.saves.error) this.toast(this.saves.error);
    this.preload("lab");
  }
  applySettings() {
    this.settings.speed = Math.max(
      0,
      Math.min(80, Number(this.settings.speed) || 0),
    );
    this.settings.font = Math.max(
      16,
      Math.min(28, Number(this.settings.font) || 22),
    );
    this.settings.auto = Math.max(
      800,
      Math.min(6000, Number(this.settings.auto) || 2600),
    );
    this.settings.music = Math.max(
      0,
      Math.min(1, Number(this.settings.music) || 0),
    );
    this.settings.sfx = Math.max(
      0,
      Math.min(1, Number(this.settings.sfx) || 0),
    );
    document.documentElement.style.setProperty(
      "--dialogue-size",
      this.settings.font + "px",
    );
    document.body.classList.toggle(
      "reduced",
      this.settings.reduced || reduced(),
    );
    if (this.effects.reduced()) this.effects.cancel();
    this.sound.settings = this.settings;
    this.sound.volume();
    if (this.inChoice && this.scene()?.timer) {
      $("#choiceTimer").hidden = !this.settings.timed;
      if (this.settings.timed && !this.timer) {
        this.choiceRemaining =
          this.choiceRemaining || this.scene().timer.seconds;
        this.runChoiceTimer();
      }
    }
  }
  save() {
    if (this.state) {
      this.saves.save(this.state);
      this.effects.saved();
      if (this.saves.memory && !this.storageWarned) {
        this.storageWarned = true;
        this.toast(this.saves.error || "存档仅保留在本次内存，请导出备份。");
      }
    }
  }
  showTitle() {
    this.motion.clear();
    this.clearCG();
    this.stopReading();
    this.stopModes();
    this.view = "title";
    document.body.dataset.view = "title";
    this.effects.clear();
    clearTimeout(this.panels.toastTimer);
    $("#toast").hidden = true;
    this.inChoice = false;
    this.curtain = false;
    $("#gameScreen").hidden = true;
    $("#titleScreen").hidden = false;
    $("#endingScreen").hidden = true;
    this.unhide();
    document.body.classList.remove("night");
    this.backdrop("bridge");
    this.effects.title();
    const s = this.saves.data.auto;
    $("#continueButton").disabled = !s;
    $("#continueLabel").textContent = s
      ? `${chapterFor(this.story, s.scene)?.title || "故事"} · ${this.story.scenes[s.scene]?.time || ""}`
      : "尚未开始的清晨";
  }
  async start() {
    if (
      this.saves.data.auto &&
      !(await this.confirm(
        "重新开始故事？",
        "自动存档将替换，手动存档和已收集的档案会保留。",
      ))
    )
      return;
    this.state = newState(this.story);
    this.stopModes();
    this.startScene(true);
  }
  load(state) {
    try {
      this.state = validateSave(state, this.story);
      this.closePanel();
      this.stopModes();
      this.startScene(false);
      this.toast("存档已读取。");
    } catch (e) {
      this.toast(e.message);
    }
  }
  startScene(showCurtain = false) {
    this.motion.clear();
    this.clearCG();
    this.stopReading();
    this.inChoice = false;
    this.choiceRemaining = 0;
    this.unhide();
    const scene = this.scene();
    const beforeEvidence = new Set(this.state.evidence);
    const changed = this.lastBg !== scene.bg;
    const chapter = chapterFor(this.story, scene.id);
    const oldChapter = this.state.chapter;
    enterScene(this.state, scene, chapter);
    this.saves.collect(this.state);
    if (this.state.beat === 0) this.saves.capture(this.state);
    this.view = "game";
    document.body.dataset.view = "game";
    $("#titleScreen").hidden = true;
    $("#gameScreen").hidden = false;
    $("#endingScreen").hidden = true;
    $("#choiceArea").hidden = true;
    $("#dialogueArea").hidden = false;
    document.body.classList.toggle("night", chapter.id === "c1");
    this.backdrop(scene.bg);
    $("#chapterNumber").textContent =
      chapter.id === "fin"
        ? "FINAL CHAPTER"
        : `CHAPTER ${String(chapter.number).padStart(2, "0")}`;
    $("#chapterTitle").textContent = chapter.title;
    $("#place").textContent = scene.location;
    $("#storyTime").textContent = scene.time;
    this.effects.scene(
      scene.bg,
      changed && !showCurtain && oldChapter === chapter.id,
    );
    const gained = this.state.evidence.find((id) => !beforeEvidence.has(id));
    if (gained)
      this.effects.reward("evidence", this.story.evidence[gained].title);
    this.saves.data.collection.chapters = [
      ...new Set([...this.saves.data.collection.chapters, chapter.id]),
    ];
    if (showCurtain || oldChapter !== chapter.id) {
      this.curtain = true;
      $("#curtainNumber").textContent =
        chapter.id === "fin"
          ? "FINAL CHAPTER"
          : `CHAPTER ${String(chapter.number).padStart(2, "0")}`;
      $("#curtainTitle").textContent = chapter.title;
      $("#curtainTag").textContent = chapter.tag;
      $("#chapterCurtain").hidden = false;
      this.save();
    } else {
      this.curtain = false;
      $("#chapterCurtain").hidden = true;
      this.renderBeat();
    }
    for (const bg of new Set(
      scene.beats.map((b) => b.background).filter(Boolean),
    ))
      this.preload(bg);
    for (const key of new Set(scene.beats.map((b) => b.cg).filter(Boolean))) {
      const image = new Image();
      image.src = this.art.cgs[key].image;
    }
    for (const c of scene.choices || []) {
      const to = typeof c.next === "string" ? this.story.scenes[c.next] : null;
      if (to) this.preload(to.bg);
    }
    if (typeof scene.next === "string")
      this.preload(this.story.scenes[scene.next].bg);
  }
  scene() {
    return this.story.scenes[this.state.scene];
  }
  beats() {
    return visibleBeats(this.scene(), this.state);
  }
  readId() {
    const beat = this.beats()[this.state.beat];
    return this.state.scene + ":" + this.scene().beats.indexOf(beat);
  }
  finishScene() {
    this.stopReading();
    this.typing = false;
    if (this.scene().ending) {
      this.showEnding();
      return;
    }
    const choices = visibleChoices(this.scene(), this.state);
    if (choices.length) {
      this.stopModes();
      this.inChoice = true;
      $("#choiceArea").hidden = false;
      $("#dialogueArea").hidden = true;
      $("#choiceButtons").replaceChildren();
      const shown = (this.scene().choices || []).filter(
        (c) => matches(c.when, this.state) || c.showLocked,
      );
      shown.forEach((c, i) => {
        const b = button("", () => this.choose(c));
        b.disabled = !matches(c.when, this.state);
        b.append(
          node("small", String(i + 1).padStart(2, "0")),
          node("span", c.text, "choice-copy"),
          node("span", "→", "choice-arrow"),
        );
        b.dataset.choice = c.id;
        if (b.disabled)
          b.append(node("em", c.lockedText || "前面的选择尚未打开这条路"));
        $("#choiceButtons").append(b);
      });
      this.effects.choices();
      $("#choiceHint").textContent = this.scene().timer
        ? "先确认现场，再作出决定。"
        : "这个选择，会留下回声。";
      $("#choiceTimer").hidden = !(this.scene().timer && this.settings.timed);
      if (this.scene().timer && this.settings.timed) {
        if (!this.choiceRemaining)
          this.choiceRemaining = this.scene().timer.seconds;
        this.runChoiceTimer();
      }
      this.save();
      return;
    }
    const to = resolveNext(this.scene().next, this.state);
    if (!to) throw Error("场景缺少出口：" + this.state.scene);
    this.goto(to);
  }
  choose(c) {
    if (
      !this.inChoice ||
      !matches(c.when, this.state) ||
      $("#panel").open ||
      $("#confirm").open
    )
      return;
    this.effects.choice(
      [...document.querySelectorAll("[data-choice]")].find(
        (b) => b.dataset.choice === c.id,
      ),
      c.text,
    );
    clearInterval(this.timer);
    this.inChoice = false;
    this.choiceRemaining = 0;
    const before = new Set(this.state.evidence);
    this.state = applyChoice(this.state, c);
    this.sound.signal();
    this.startScene();
    if (c.echo) this.effects.reward("echo", this.story.echoes[c.echo].title);
    else {
      const gained = c.evidence?.find((e) => !before.has(e));
      if (gained)
        this.effects.reward("evidence", this.story.evidence[gained].title);
    }
  }
  goto(to) {
    this.state.scene = to;
    this.state.beat = 0;
    this.startScene();
  }
  showEnding() {
    this.motion.clear();
    this.clearCG();
    this.stopModes();
    this.inChoice = false;
    const end = this.story.endings[this.scene().ending];
    this.state.ending = this.scene().ending;
    this.save();
    $("#dialogueArea").hidden = true;
    $("#choiceArea").hidden = true;
    $("#endingScreen").hidden = false;
    $("#endingScreen").dataset.kind = end.kind;
    $("#endingTitle").textContent = end.title;
    $("#endingSubtitle").textContent = end.subtitle;
    $("#endingSummary").replaceChildren(
      node(
        "p",
        `本次留下 ${this.state.evidence.length} 份证据 · ${this.state.echoes.length} 个回响`,
      ),
      node(
        "p",
        `已发现 ${this.saves.data.collection.endings.length} / ${Object.keys(this.story.endings).length} 个结局`,
      ),
    );
    const causes = (this.story.ending_causes || []).filter((c) =>
      matches(c.when, this.state),
    );
    $("#endingSummary").prepend(node("p", end.label, "ending-kind"));
    for (const c of causes.slice(0, 4))
      $("#endingSummary").append(node("p", c.text, "ending-cause"));
    this.backdrop(end.bg);
    this.sound.signal();
    this.effects.ending();
  }
  chapters() {
    return openFlow(this.flowContext());
  }
  async action(action) {
    this.sound.unlock();
    if (action === "new") return this.start();
    if (action === "continue") {
      if (this.saves.data.auto) this.load(this.saves.data.auto);
      return;
    }
    this.sound.play(musicMood(this.lastBg));
    if (action === "chapterBegin") {
      this.curtain = false;
      $("#chapterCurtain").hidden = true;
      this.renderBeat();
      return;
    }
    if (action === "close") return this.closePanel();
    if (action === "title") {
      if (
        this.view === "game" &&
        !(await this.confirm("返回标题？", "当前进度已自动保存。"))
      )
        return;
      this.save();
      this.closePanel();
      this.showTitle();
      return;
    }
    if (action === "auto" || action === "skip") {
      if (this.inChoice || this.curtain) return;
      this[action] = !this[action];
      this[action === "auto" ? "skip" : "auto"] = false;
      this.updateModes();
      if (this.skip && this.typing) this.reveal();
      else this.scheduleAdvance();
      return;
    }
    if (action === "hide") return this.hide();
    if (action === "fullscreen") {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        this.toast("当前浏览器不支持全屏，可直接游玩。");
      }
      return;
    }
    if (action === "menu") return this.menu();
    if (action === "flow") return openFlow(this.flowContext());
    if (action === "chapters") return this.chapters();
    if (action === "save" || action === "load") return this.savePanel(action);
    if (action === "archive") return this.archive();
    if (action === "evidence") return this.archive("evidence", true);
    if (action === "backlog") return this.backlog();
    if (action === "settings") return this.settingsPanel();
    if (action === "credits") return this.credits();
  }
  stopReading(...args) {
    return this.reading.stopReading(...args);
  }
  stopModes(...args) {
    return this.reading.stopModes(...args);
  }
  updateModes(...args) {
    return this.reading.updateModes(...args);
  }
  renderBeat(...args) {
    return this.reading.renderBeat(...args);
  }
  completeTyping(...args) {
    return this.reading.completeTyping(...args);
  }
  reveal(...args) {
    return this.reading.reveal(...args);
  }
  blocked(...args) {
    return this.reading.blocked(...args);
  }
  scheduleAdvance(...args) {
    return this.reading.scheduleAdvance(...args);
  }
  advance(...args) {
    return this.reading.advance(...args);
  }
  runChoiceTimer(...args) {
    return this.reading.runChoiceTimer(...args);
  }
  preload(...args) {
    return this.sceneView.preload(...args);
  }
  backdrop(...args) {
    return this.sceneView.backdrop(...args);
  }
  cast(...args) {
    return this.sceneView.cast(...args);
  }
  clearCG(...args) {
    return this.sceneView.clearCG(...args);
  }
  renderVisual(...args) {
    return this.sceneView.renderVisual(...args);
  }
  unhide(...args) {
    return this.sceneView.unhide(...args);
  }
  hide(...args) {
    return this.sceneView.hide(...args);
  }
  toast(...args) {
    return this.panels.toast(...args);
  }
  openPanel(...args) {
    return this.panels.openPanel(...args);
  }
  closePanel(...args) {
    return this.panels.closePanel(...args);
  }
  confirm(...args) {
    return this.panels.confirm(...args);
  }
  menu(...args) {
    return this.panels.menu(...args);
  }
  savePanel(...args) {
    return this.panels.savePanel(...args);
  }
  saveCard(...args) {
    return this.panels.saveCard(...args);
  }
  backupButtons(...args) {
    return this.panels.backupButtons(...args);
  }
  export(...args) {
    return this.panels.export(...args);
  }
  archive(...args) {
    return this.panels.archive(...args);
  }
  cgArchive(...args) {
    return this.panels.cgArchive(...args);
  }
  backlog(...args) {
    return this.panels.backlog(...args);
  }
  settingsPanel(...args) {
    return this.panels.settingsPanel(...args);
  }
  credits(...args) {
    return this.panels.credits(...args);
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    this.applySettings();
    this.saves.write();
  }
  saveSlot(slot) {
    return this.saves.save(this.state, slot);
  }
  exportRaw() {
    const raw = this.saves.exportRaw();
    if (raw === null) return;
    const url = URL.createObjectURL(
      new Blob([raw], { type: "application/octet-stream" }),
    );
    const a = node("a");
    a.href = url;
    a.download = "残响协议-原始存档.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async replay(point, choice) {
    if (
      !(await this.confirm(
        "从这里改走另一条路线？",
        "恢复该节点原有的证据、关系与记忆状态。其后的当前路线重新生成；已经探索的节点和结局保留。",
      ))
    )
      return;
    const state = clone(point.state);
    state.ending = null;
    state.flags.finished = false;
    this.load(state);
    if (choice) {
      this.state.beat = this.beats().length;
      this.renderBeat();
      if (this.inChoice && matches(choice.when, this.state))
        this.choose(choice);
    }
    this.toast("已恢复这个节点的状态，后续会按新选择推进。");
  }
  panelContext() {
    const controller = this;
    return {
      get story() {
        return controller.story;
      },
      get art() {
        return controller.art;
      },
      get state() {
        return controller.state ? clone(controller.state) : null;
      },
      get settings() {
        return { ...controller.settings };
      },
      get view() {
        return controller.view;
      },
      get autoTimer() {
        return controller.autoTimer;
      },
      get saves() {
        return {
          data: clone(controller.saves.data),
          memory: controller.saves.memory,
          error: controller.saves.error,
          exportRaw: () => controller.saves.exportRaw(),
          export: () => controller.saves.export(),
          write: () => controller.saves.write(),
        };
      },
      effects: controller.effects,
      ...Object.fromEntries(
        [
          "stopModes",
          "scheduleAdvance",
          "save",
          "saveSlot",
          "load",
          "action",
          "openPanel",
          "closePanel",
          "confirm",
          "savePanel",
          "archive",
          "cgArchive",
          "saveCard",
          "backupButtons",
          "export",
          "exportRaw",
          "toast",
          "applySettings",
          "updateSetting",
        ].map((name) => [name, (...args) => controller[name](...args)]),
      ),
    };
  }
  flowContext() {
    return {
      story: this.story,
      art: this.art,
      state: this.state ? clone(this.state) : null,
      auto: clone(this.saves.data.auto),
      collection: clone(this.saves.data.collection),
      points: clone(this.saves.data.points),
      openPanel: (...args) => this.openPanel(...args),
      replay: (...args) => this.replay(...args),
      animate: (...args) => this.effects.animate(...args),
      reduced: () => this.effects.reduced(),
    };
  }
  destroy() {
    this.motion.dispose();
    this.inputs.dispose();
    this.stopReading();
    this.stopModes();
    this.sound.pause();
    this.effects.dispose();
    clearInterval(this.sound.interval);
    this.sound.ctx?.close().catch(() => {});
    clearTimeout(this.panels.toastTimer);
    $("#panel").close();
    $("#confirm").close();
  }
}
