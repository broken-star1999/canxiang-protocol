import { $, musicMood } from "../ui/dom.js?v=5";
import { matches } from "../engine.js?v=5";
export class InputBindings {
  constructor(game) {
    this.game = game;
    this.abort = new AbortController();
  }
  mount() {
    const game = this.game;
    const listen = (target, event, callback) =>
      target.addEventListener(event, callback, { signal: this.abort.signal });
    listen(document, "dragstart", (event) => {
      if (event.target instanceof HTMLImageElement) event.preventDefault();
    });
    listen(document, "click", (e) => {
      const b = e.target.closest("[data-action]");
      if (b && !b.disabled)
        game
          .action(b.dataset.action)
          .catch((err) => game.toast("操作未完成：" + err.message));
    });
    $("#dialogue").onclick = () => {
      game.sound.unlock();
      game.advance();
    };
    listen(document, "keydown", (e) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if ($("#confirm").open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if ($("#panel").open) game.closePanel();
        else if (game.view === "game") game.menu();
        return;
      }
      if ($("#panel").open || game.view !== "game") return;
      if (game.inChoice && /^[1-6]$/.test(e.key)) {
        const c = (game.scene().choices || []).filter(
          (c) => matches(c.when, game.state) || c.showLocked,
        )[Number(e.key) - 1];
        if (c && matches(c.when, game.state)) {
          e.preventDefault();
          game.choose(c);
        }
        return;
      }
      if ([" ", "Enter"].includes(e.key)) {
        if (e.target.tagName === "BUTTON" && e.target.id !== "dialogue") return;
        e.preventDefault();
        if (game.curtain) game.action("chapterBegin");
        else game.advance();
      } else if (e.key.toLowerCase() === "h") game.hide();
      else if (e.key.toLowerCase() === "a") game.action("auto");
      else if (e.key.toLowerCase() === "l") game.backlog();
    });
    listen($("#panel"), "cancel", (e) => {
      e.preventDefault();
      game.closePanel();
    });
    listen($("#panel"), "click", (e) => {
      if (e.target !== $("#panel")) return;
      const r = $("#panel").getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        game.closePanel();
    });
    $("#importFile").onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const preview = JSON.parse(text);
        if (preview.game !== "canxiang-vn")
          throw Error("请选择《残响协议》导出的存档文件");
        if (
          !(await game.confirm(
            "导入这份存档？",
            "当前进度和手动槽将被替换，请先导出需要保留的备份。",
          ))
        )
          return;
        game.saves.import(text);
        game.settings = game.saves.data.settings;
        game.applySettings();
        game.state = null;
        game.closePanel();
        game.showTitle();
        game.toast("存档已导入，可继续故事。");
      } catch (err) {
        game.toast("导入失败：" + err.message);
      } finally {
        e.target.value = "";
      }
    };
    listen(document, "visibilitychange", () => {
      if (document.hidden) {
        clearTimeout(game.autoTimer);
        game.sound.pause();
        game.save();
      } else {
        game.sound.unlock().then(() => game.sound.play(musicMood(game.lastBg)));
        game.scheduleAdvance();
      }
    });
    listen(matchMedia("(prefers-reduced-motion: reduce)"), "change", () =>
      game.applySettings(),
    );
    listen(window, "pagehide", () => game.save());
  }
  dispose() {
    this.abort.abort();
    $("#dialogue").onclick = null;
    $("#importFile").onchange = null;
  }
}
