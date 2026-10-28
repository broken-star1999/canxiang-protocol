import { $, node, button, reduced, dateText } from "../ui/dom.js";
import { chapterFor } from "../engine.js?v=4";
import { discoveredCGs } from "../presentation.js?v=4";

export class Panels {
  constructor(game) {
    this.game = game;
  }
  toast(text) {
    $("#toast").textContent = text;
    $("#toast").hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => ($("#toast").hidden = true), 4500);
  }
  openPanel(title, eyebrow) {
    clearTimeout(this.game.autoTimer);
    this.game.stopModes();
    $("#panelTitle").textContent = title;
    $("#panelEyebrow").textContent = eyebrow;
    $("#panelBody").replaceChildren();
    $("#panelBody").classList.remove("flow-panel");
    if (!$("#panel").open) $("#panel").showModal();
    $("#panelBody").scrollTop = 0;
    queueMicrotask(() => this.game.effects.panel());
    return $("#panelBody");
  }
  closePanel() {
    if ($("#panel").open) $("#panel").close();
    this.game.scheduleAdvance();
  }
  confirm(title, text) {
    return new Promise((resolve) => {
      clearTimeout(this.game.autoTimer);
      const dlg = $("#confirm");
      $("#confirmTitle").textContent = title;
      $("#confirmText").textContent = text;
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        dlg.close();
        resolve(v);
      };
      $("#confirmOK").onclick = () => finish(true);
      $("#confirmCancel").onclick = () => finish(false);
      dlg.oncancel = (e) => {
        e.preventDefault();
        finish(false);
      };
      dlg.showModal();
    });
  }
  menu() {
    const body = this.game.openPanel("暂停这一刻", "PAUSE");
    const grid = node("div", undefined, "menu-list");
    for (const [label, action] of [
      ["返回故事", "close"],
      ["保存进度", "save"],
      ["读取存档", "load"],
      ["证据档案", "evidence"],
      ["故事线与回溯", "flow"],
      ["阅读设置", "settings"],
      ["全屏显示", "fullscreen"],
      ["返回标题", "title"],
    ])
      grid.append(button(label, () => this.game.action(action)));
    body.append(
      grid,
      node(
        "p",
        "空格 / 回车：继续 · Esc：菜单 · 1–6：选择 · H：隐藏界面 · A：自动阅读",
        "panel-note",
      ),
    );
  }
  savePanel(mode) {
    const body = this.game.openPanel(
      mode === "save" ? "保存这一刻" : "回到某一刻",
      mode === "save" ? "SAVE" : "LOAD",
    );
    body.append(
      node(
        "p",
        this.game.saves.memory
          ? "浏览器存储不可用，请使用下方导出备份。"
          : "自动存档随阅读更新。六个手动槽可保留不同的选择。",
        "panel-note",
      ),
    );
    const grid = node("div", undefined, "save-grid");
    if (mode === "load")
      grid.append(
        this.game.saveCard(
          this.game.saves.data.auto,
          "自动存档",
          () => this.game.load(this.game.saves.data.auto),
          !!this.game.saves.data.auto,
          "继续",
        ),
      );
    this.game.saves.data.slots.forEach((s, i) =>
      grid.append(
        this.game.saveCard(
          s,
          `SLOT ${String(i + 1).padStart(2, "0")}`,
          async () => {
            if (mode === "save") {
              if (!this.game.state) {
                this.game.toast("先开始故事再保存。");
                return;
              }
              if (
                s &&
                !(await this.game.confirm(
                  "覆盖这个存档？",
                  "该手动槽中的旧进度将被替换。",
                ))
              )
                return;
              this.game.saveSlot(i);
              this.game.effects.saved(true);
              this.game.savePanel(mode);
              this.game.toast(
                this.game.saves.memory
                  ? "已保存在本次内存，请导出备份。"
                  : "存档已保存。",
              );
            } else if (s) {
              if (
                this.game.state &&
                !(await this.game.confirm(
                  "读取这个存档？",
                  "当前自动进度将替换，手动槽保留。",
                ))
              )
                return;
              this.game.load(s);
            }
          },
          mode === "save" ? !!this.game.state : !!s,
          mode === "save" ? "保存到这里" : "读取",
        ),
      ),
    );
    body.append(grid);
    this.game.backupButtons(body);
  }
  saveCard(s, label, fn, enabled, action) {
    const card = node("div", undefined, "save-card");
    card.append(node("span", label, "eyebrow"));
    const scene = s && this.game.story.scenes[s.scene],
      chapter = s && chapterFor(this.game.story, s.scene);
    card.append(
      node("h3", s ? chapter.title : "空白存档"),
      node("small", s ? `${scene.location} · ${scene.time}` : "留给另一种选择"),
    );
    if (s) {
      const img = node("img");
      img.src = this.game.art.backgrounds[scene.bg];
      img.alt = "";
      card.append(img, node("small", dateText(s.lastSaved)));
    }
    const b = button(action, fn);
    b.disabled = !enabled;
    card.append(b);
    return card;
  }
  backupButtons(body) {
    const row = node("div", undefined, "backup-actions");
    row.append(
      button("导出全部存档", () => this.game.export()),
      button("导入存档文件", () => $("#importFile").click()),
    );
    if (this.game.saves.exportRaw() !== null)
      row.append(button("导出原始存档", () => this.game.exportRaw()));
    body.append(row);
  }
  export() {
    this.game.save();
    const blob = new Blob([this.game.saves.export()], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download =
      "残响协议-存档-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.game.toast("存档备份已导出。");
  }
  archive(tab = "endings", current = false) {
    const body = this.game.openPanel(
      current ? "眼前的线索" : "留下的回响",
      "ARCHIVE",
    );
    const tabs = node("div", undefined, "panel-tabs");
    for (const [id, label] of [
      ["endings", "结局"],
      ["evidence", "证据"],
      ["echoes", "回响"],
      ["cgs", "画面"],
      ["choices", "本次选择"],
    ]) {
      const b = button(
        label,
        () => this.game.archive(id, current),
        id === tab ? "active" : "",
      );
      tabs.append(b);
    }
    body.append(tabs);
    if (tab === "cgs") {
      this.game.cgArchive(body);
      return;
    }
    const collected =
      current && this.game.state
        ? this.game.state
        : this.game.saves.data.collection;
    if (tab === "choices") {
      if (!this.game.state?.choices.length) {
        body.append(node("p", "开始故事后，这里会留下你的回答。"));
        return;
      }
      const list = node("div", undefined, "backlog");
      this.game.state.choices.forEach((c) => {
        const row = node("div", undefined, "backlog-line");
        row.append(
          node("small", this.game.story.scenes[c.scene]?.location || ""),
          node("p", c.text),
        );
        list.append(row);
      });
      body.append(list);
      return;
    }
    const grid = node("div", undefined, "archive-grid");
    const ids =
      tab === "endings"
        ? this.game.saves.data.collection.endings
        : collected[tab];
    Object.entries(this.game.story[tab]).forEach(([id, item], i) => {
      const found = ids.includes(id);
      const card = node(
        "article",
        undefined,
        "archive-item" + (!found ? " locked" : ""),
      );
      if (tab === "endings" && found) {
        const img = node("img");
        img.src = this.game.art.backgrounds[item.bg];
        img.alt = "";
        card.append(img);
      }
      if (tab === "endings" && found)
        card.append(node("span", item.label, "ending-kind " + item.kind));
      card.append(
        node(
          "span",
          `${tab === "endings" ? "ENDING" : tab === "evidence" ? "RECORD" : "ECHO"} / ${String(i + 1).padStart(2, "0")}`,
          "eyebrow",
        ),
        node("h3", found ? item.title : "尚未发现"),
        node(
          "p",
          found
            ? item.text || item.subtitle
            : "继续故事，让它在你的选择中出现。",
        ),
      );
      grid.append(card);
    });
    body.append(grid);
    if (tab === "evidence")
      body.append(
        node(
          "p",
          "证据说明只展示已获得的材料。复盘与最终责任认定需要结合原始记录。",
          "panel-note",
        ),
      );
  }
  cgArchive(body) {
    const known = discoveredCGs(
      this.game.story,
      this.game.saves.data.collection.read,
    );
    body.append(
      node(
        "p",
        `已留下 ${known.size} / ${Object.keys(this.game.art.cgs).length} 幅画面。只展示你已经读到的事件。`,
        "panel-note",
      ),
    );
    const grid = node("div", undefined, "archive-grid cg-grid");
    for (const [index, [key, item]] of Object.entries(
      this.game.art.cgs,
    ).entries()) {
      const found = known.has(key),
        card = node(
          "article",
          undefined,
          "archive-item" + (found ? "" : " locked"),
        );
      if (found) {
        const img = node("img");
        img.src = item.image;
        img.alt = item.text;
        img.loading = "lazy";
        card.append(img);
      }
      card.append(
        node(
          "span",
          found ? "MEMORY / " + String(index + 1).padStart(2, "0") : "UNSEEN",
          "eyebrow",
        ),
        node("h3", found ? item.title : "尚未留下的画面"),
        node("p", found ? item.text : "在故事中抵达这个时刻后解锁。"),
      );
      if (found)
        card.append(
          button("展开画面", () => {
            const panel = this.game.openPanel(item.title, "MEMORY");
            const img = node("img");
            img.src = item.image;
            img.alt = item.text;
            img.className = "cg-gallery-image";
            panel.append(
              img,
              node("p", item.text, "panel-note"),
              button("返回画面档案", () => this.game.archive("cgs"), "outline"),
            );
          }),
        );
      grid.append(card);
    }
    body.append(grid);
  }
  backlog() {
    const body = this.game.openPanel("刚才说过的话", "BACKLOG");
    const list = node("div", undefined, "backlog");
    if (!this.game.state?.history.length)
      list.append(node("p", "这里还没有对话。"));
    for (const h of this.game.state?.history || []) {
      const row = node("div", undefined, "backlog-line");
      row.append(
        node(
          "small",
          h.time + " · " + this.game.story.scenes[h.scene]?.location,
        ),
        node("strong", h.speaker),
        node("p", h.text),
      );
      list.append(row);
    }
    body.append(list);
    body.scrollTop = body.scrollHeight;
  }
  settingsPanel() {
    const body = this.game.openPanel("让故事适合你", "SETTINGS");
    const grid = node("div", undefined, "settings-grid");
    const ranges = [
      ["speed", "文字速度", 0, 80, 1, "字 / 秒；0 为立即显示"],
      ["font", "文字大小", 16, 28, 1, "手机与电脑分别自适应布局"],
      ["auto", "自动阅读停留", 800, 6000, 100, "毫秒；另加文字阅读时间"],
      ["music", "音乐音量", 0, 1, 0.05, "原创环境配乐；0 为关闭"],
      ["sfx", "提示音音量", 0, 1, 0.05, "按钮与获得线索的提示音"],
    ];
    for (const [key, label, min, max, step, hint] of ranges) {
      const setting = node("div", undefined, "setting");
      const l = node("label", label),
        value = node("span", String(this.game.settings[key]));
      l.append(value);
      const input = node("input");
      input.type = "range";
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = this.game.settings[key];
      input.id = "setting-" + key;
      l.htmlFor = input.id;
      input.oninput = () => {
        this.game.updateSetting(key, Number(input.value));
        value.textContent = input.value;
        this.game.applySettings();
      };
      setting.append(l, input, node("small", hint));
      grid.append(setting);
    }
    for (const [key, label, hint] of [
      ["reduced", "减少动态效果", "关闭文字打字与界面动画，保留全部剧情。"],
      [
        "timed",
        "紧急选择限时",
        "仅预检救援场景限时。关闭可从容阅读；打开菜单或切换后台时暂停。",
      ],
    ]) {
      const setting = node("div", undefined, "setting"),
        l = node("label", label),
        input = node("input");
      input.type = "checkbox";
      input.checked = this.game.settings[key];
      input.onchange = () => {
        this.game.updateSetting(key, input.checked);
        this.game.applySettings();
      };
      l.append(input);
      setting.append(l, node("small", hint));
      grid.append(setting);
    }
    body.append(
      grid,
      node(
        "p",
        "音频在首次点击后启用。故事中有事故、伤害与身份焦虑描写，画面不包含重口血腥。",
        "panel-note",
      ),
    );
    this.game.backupButtons(body);
  }
  credits() {
    const body = this.game.openPanel("关于这段清晨", "ABOUT");
    const copy = node("div", undefined, "credits");
    copy.append(
      node("h3", "残响协议"),
      node(
        "p",
        "一部关于记忆、责任与独立意愿的科幻互动视觉小说。场景、人物与事件均为虚构。故事关注记忆、责任与选择，不提供真实设备的操作指导。",
      ),
      node("h3", "阅读与游玩"),
      node(
        "p",
        "点击对话或按空格继续。先显示完整文字，再推进下一句。关键选择按1–6作答。故事线可恢复过去节点并改选，后续状态重新生成。自动阅读会在选择前停下，快进只通过已经读过的内容。随时打开回看、档案和存档。",
      ),
      node("h3", "制作与资源"),
      node(
        "p",
        "日漫人物与二维背景由AI生成，经过风格重做与视觉检查后拆分压缩。音乐和提示音为本项目原创程序合成；没有配音。使用浏览器原生模块、Web Audio和CSS动画，无外部运行依赖。",
      ),
      node("h3", "你的存档"),
      node(
        "p",
        "全部进度仅保存在当前浏览器，可导出文件跨设备迁移。清理浏览器数据会清除本地进度，请定期导出备份。",
      ),
    );
    const a = node("a", "项目源码 ↗");
    a.href = "https://github.com/broken-star1999/canxiang-protocol";
    a.target = "_blank";
    a.rel = "noopener";
    copy.append(a);
    body.append(copy);
  }
}
