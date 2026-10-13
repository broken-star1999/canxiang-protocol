(function () {
  "use strict";
  const D = window.STORY;
  const E = window.Engine;
  const $ = selector => document.querySelector(selector);
  const chapters = D.chapters || [];
  const chapterById = Object.fromEntries(chapters.map(chapter => [chapter.id, chapter]));
  const chapterOrder = chapters.map(chapter => chapter.id);
  const scenesByChapter = Object.fromEntries(chapters.map(chapter => [chapter.id,
    Object.fromEntries((chapter.scenes || []).map(scene => [scene.id, scene]))]));
  const choicesByChapter = Object.fromEntries(chapters.map(chapter => [chapter.id,
    Object.fromEntries((chapter.scenes || []).flatMap(scene => (scene.choices || []).map(choice => [choice.id, choice])))]));
  const displayNames = D.display_names || {};
  const screenParam = new URLSearchParams(location.search).get("screen");
  const debugMode = new URLSearchParams(location.search).get("debug") === "1";
  const devMode = new URLSearchParams(location.search).get("dev") === "1" ||
    screenParam === "chapters" || screenParam === "game";
  const STORE_KEY = "echo-protocol:v3:archive";

  let archive = E.newArchive();
  let memoryOnly = false;
  let state = null;
  let activeChapter = null;
  let activeRunId = null;
  let activeEnding = null;
  let replayNeedsDecision = false;
  let awaitingResult = false;
  let timeoutLightTimer = null;
  let options = { showKey: false };

  function mappedName(group, id, field) {
    const entry = displayNames[group] && displayNames[group][id];
    const value = field && entry && typeof entry === "object" ? entry[field] : entry;
    return typeof value === "string" && value.trim() ? value : "—";
  }
  function chapterName(id) { return mappedName("chapters", id); }
  function endingName(id) { return mappedName("endings", id); }
  function statName(id) { return mappedName("stats", id, "name"); }
  function stateName(id) {
    return mappedName("states", id) !== "—" ? mappedName("states", id) : mappedName("scenes", id);
  }
  function echoName(id) { return mappedName("echoes", id, "name"); }
  function echoValueName(id, value) {
    const values = displayNames.echoes && displayNames.echoes[id] && displayNames.echoes[id].values;
    return values && typeof values[value] === "string" && values[value].trim() ? values[value] : "—";
  }
  function selfEndingName(id) {
    const name = mappedName("self_endings", id);
    return name === "—" ? mappedName("self_endings", "_hidden") : name;
  }
  function runName(id) {
    const match = /^run_(\d+)$/i.exec(String(id || ""));
    const format = displayNames.runs && displayNames.runs.format;
    return match && typeof format === "string" ? format.replace("{n}", String(Number(match[1]))) : "—";
  }
  function formatArchiveDateTime(value) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return "—";
    const pad = part => String(part).padStart(2, "0");
    return `${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function choiceName(chapterId, choiceId) {
    const choice = choicesByChapter[chapterId] && choicesByChapter[chapterId][choiceId];
    return choice && typeof choice.label === "string" && choice.label ? choice.label : "—";
  }

  function safeLoad() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      let migratedLegacy = false;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.schemaVersion === 3) archive = parsed;
      } else {
        const legacyRaw = localStorage.getItem("cx_save");
        if (legacyRaw) {
          try {
            archive = E.migrateLegacy(archive, JSON.parse(legacyRaw));
            migratedLegacy = !!archive.inProgress;
          }
          catch (_) { /* Keep a clean archive if the old save is malformed. */ }
        }
      }
      options.showKey = !!(archive.settings && archive.settings.showKey);
      if (migratedLegacy) saveArchive();
    } catch (_) {
      memoryOnly = true;
      setMessage("浏览器存储不可用；本次进度保存在内存中，请导出存档码。", true);
    }
  }
  function saveArchive() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(archive));
      memoryOnly = false;
    } catch (_) {
      memoryOnly = true;
      setMessage("存档写入失败；进度暂存在内存中，请导出存档码备份。", true);
    }
  }
  function setMessage(message, loud) {
    const target = $("#globalMsg");
    if (target) {
      target.textContent = message || "";
      target.classList.toggle("notice", !!loud);
    }
  }
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined && text !== null) element.textContent = String(text);
    if (className) element.className = className;
    return element;
  }
  function button(label, onClick, className) {
    const element = node("button", label, className || "");
    element.type = "button";
    element.addEventListener("click", onClick);
    return element;
  }
  function showView(id) {
    document.querySelectorAll(".view").forEach(view => view.classList.add("hidden"));
    const view = $("#" + id);
    if (view) view.classList.remove("hidden");
    document.querySelectorAll(".panel").forEach(panel => panel.classList.add("hidden"));
    window.scrollTo(0, 0);
  }
  function imagePath(key) { return (D.images || {})[key] || null; }
  function echoIconPath(def) {
    return (def && def.icon && imagePath("icon:" + def.icon)) || imagePath("icon:icon_echo") || null;
  }
  function appendEchoIcon(parent, def, title, recorded) {
    const src = echoIconPath(def);
    if (src) {
      const icon = node("img", undefined, "echo-dot");
      const fallback = imagePath("icon:icon_echo");
      let usingFallback = src === fallback;
      icon.alt = "";
      icon.title = title;
      icon.setAttribute("aria-hidden", "true");
      icon.onerror = () => {
        if (!usingFallback && fallback) {
          usingFallback = true;
          icon.src = fallback;
        } else icon.remove();
      };
      icon.src = src;
      parent.appendChild(icon);
      return;
    }
    const dot = node("span", undefined, "echo-dot");
    dot.style.backgroundColor = recorded ? "#49dfd1" : "#426057";
    dot.title = title;
    dot.setAttribute("aria-hidden", "true");
    parent.appendChild(dot);
  }
  function renderArchiveHeadingIcons() {
    document.querySelectorAll("#archiveView .archive-section-title").forEach(heading => {
      const src = imagePath("icon:" + heading.dataset.icon);
      const current = heading.querySelector(".archive-heading-icon");
      if (!src) {
        if (current) current.remove();
        return;
      }
      const icon = current || node("img", undefined, "archive-heading-icon");
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      icon.src = src;
      icon.onerror = () => icon.remove();
      if (!current) heading.insertBefore(icon, heading.firstChild);
    });
  }
  function setImage(element, key, placeholder) {
    const src = imagePath(key);
    element.style.backgroundImage = "";
    element.textContent = placeholder || "";
    element.classList.remove("image-ready");
    element.classList.remove("image-loading");
    if (element.classList.contains("ending-image")) {
      const dimensions = (D.image_dimensions || {})[key];
      if (dimensions && dimensions.width && dimensions.height) {
        element.style.aspectRatio = `${dimensions.width} / ${dimensions.height}`;
      } else {
        element.style.aspectRatio = "16 / 9";
      }
    }
    if (!src) return;
    element.classList.add("image-loading");
    const image = new Image();
    image.onload = () => {
      element.style.backgroundImage = `url("${src}")`;
      element.textContent = "";
      element.classList.remove("image-loading");
      element.classList.add("image-ready");
    };
    image.onerror = () => {
      element.textContent = placeholder || "";
      element.classList.remove("image-loading");
    };
    image.src = src;
  }
  function echoDefaults(ids) {
    const allowed = ids ? new Set(ids) : null;
    const result = {};
    for (const echo of D.echoes || []) if ((!allowed || allowed.has(echo.id)) && echo.default !== undefined) result[echo.id] = echo.default;
    return result;
  }
  function chapterInputs(target) {
    if (devMode) return {
      values: E.defaultValues(target),
      echoes: echoDefaults((target.imports || {}).echoes),
      flags: []
    };
    const targetIndex = chapterOrder.indexOf(target.id);
    let values = E.carryValues({}, chapters[0] || target);
    const allEchoes = {}, allFlags = new Set();
    for (let index = 0; index < targetIndex; index++) {
      const previousChapter = chapters[index];
      const nextChapter = chapters[index + 1];
      const runId = archive.mainline && archive.mainline[previousChapter.id];
      const run = runId && archive.runs[runId];
      if (!run) continue;
      values = E.carryValues(run.valuesOut || {}, nextChapter);
      Object.assign(allEchoes, run.echoesOut || {});
      for (const flag of run.flagsOut || []) allFlags.add(flag);
    }
    const importedEchoes = {};
    for (const id of (target.imports || {}).echoes || []) importedEchoes[id] = ownValue(allEchoes, id) ? allEchoes[id] : echoDefaults([id])[id];
    const allowedFlags = new Set((target.imports || {}).flags || []);
    return {
      values: targetIndex === 0 ? E.carryValues({}, target) : values,
      echoes: importedEchoes,
      flags: [...allFlags].filter(flag => allowedFlags.has(flag))
    };
  }
  function ownValue(object, key) { return Object.prototype.hasOwnProperty.call(object || {}, key); }
  function runCount() { return Object.keys(archive.runs || {}).length; }
  function nextRunId() { return "run_" + String(runCount() + 1).padStart(4, "0"); }

  function setTopNav() {
    const statsButton = document.querySelector('[data-panel="statsPanel"]');
    if (statsButton) {
      statsButton.classList.toggle("hidden", !debugMode);
      if (debugMode) statsButton.textContent = "数值（调试）";
    }
    $("#navChapters").onclick = showChapterSelect;
    $("#navArchive").onclick = showArchive;
    $("#navMenu").onclick = () => $("#menuPanel").classList.toggle("hidden");
    $("#titleStart").onclick = showChapterSelect;
    $("#titleArchive").onclick = showArchive;
    $("#titleDev").classList.add("hidden");
    $("#showKey").checked = options.showKey;
    $("#showKey").onchange = event => {
      options.showKey = event.target.checked;
      archive.settings = archive.settings || {};
      archive.settings.showKey = options.showKey;
      saveArchive();
      if (state) renderGame();
    };
    $("#saveNow").onclick = () => { saveArchive(); setMessage(memoryOnly ? "请导出存档码备份。" : "档案已保存。", memoryOnly); };
    $("#resumeSave").onclick = resumeInProgress;
    $("#restartRun").onclick = () => {
      if (activeChapter) startChapter(activeChapter.id, true);
    };
    $("#exportCode").onclick = exportCode;
    $("#importCode").onclick = importCode;
  }
  function unlocked(chapter) {
    if (devMode) return true;
    if ((chapter.unlock || {}).always) return true;
    return (chapter.unlock && chapter.unlock.completed || []).every(id =>
      !!(archive.mainline && archive.mainline[id]) || (archive.collection.endings[id] || []).length > 0);
  }
  function chapterStatus(chapter) {
    const mainId = archive.mainline && archive.mainline[chapter.id];
    const mainRun = mainId && archive.runs[mainId];
    if (mainRun && mainRun.stale) return "回响已改变，可重玩";
    if (chapter.status === "coming_soon" && !devMode) return "即将开放";
    if (mainRun && mainRun.ending) {
      return "已完成 · " + endingName(mainRun.ending);
    }
    if (!unlocked(chapter)) return "未解锁 · 完成上一章后开放";
    if (chapter.status === "released" || devMode) return "可游玩";
    return "即将开放";
  }
  function findEnding(chapterId, endingId) {
    const chapter = chapterById[chapterId];
    return (chapter && chapter.endings || []).find(ending => ending.id === endingId) ||
      (D.fin_endings || []).find(ending => ending.id === endingId) || null;
  }
  function showChapterSelect() {
    showView("chapterSelectView");
    const list = $("#chapterCards");
    list.replaceChildren();
    for (const chapter of chapters) {
      const card = node("article", undefined, "chapter-card");
      const cover = node("img", undefined, "chapter-cover");
      cover.alt = chapterName(chapter.id) + "章节封面";
      if (chapter.status === "released" && !devMode && !unlocked(chapter)) cover.classList.add("locked-cover");
      const coverSource = imagePath("chapter:" + chapter.id);
      if (coverSource) cover.src = coverSource;
      else { cover.classList.add("missing-cover"); cover.alt = "章节封面暂缺"; }
      cover.onerror = () => { cover.removeAttribute("src"); cover.classList.add("missing-cover"); };
      card.appendChild(cover);
      const copy = node("div", undefined, "chapter-copy");
      copy.appendChild(node("h2", chapterName(chapter.id)));
      copy.appendChild(node("p", chapter.premise || ""));
      const status = chapterStatus(chapter);
      copy.appendChild(node("p", status, "chapter-status"));
      const imports = (chapter.exports || {}).echoes || [];
      if (imports.length) {
        const icons = node("div", undefined, "echo-icons");
        for (const echoId of imports) {
          const def = (D.echoes || []).find(item => item.id === echoId);
          const current = mainEchoValue(chapter.id, echoId);
          appendEchoIcon(icons, def, current ? "已记录的回响" : "尚未记录", !!current);
        }
        copy.appendChild(icons);
      }
      const canOpen = (chapter.status === "released" || devMode) && unlocked(chapter);
      const openChapter = () => {
        if (!canOpen) return;
        if (chapter.id === "fin" && hasStaleMainline()) setMessage("提示：部分前置章节主线记录已标记为回响已改变。本章仍可进入。", true);
        showIntro(chapter);
      };
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-disabled", String(!canOpen));
      card.addEventListener("click", event => {
        const target = event.target;
        if (target && typeof target.closest === "function" && target.closest("button")) return;
        openChapter();
      });
      card.addEventListener("keydown", event => {
        if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        openChapter();
      });
      const action = button(canOpen ? (archive.inProgress && archive.runs[archive.inProgress.run]?.chapter === chapter.id ? "继续 / 重开" : "进入章节") : status,
        event => {
          event.stopPropagation();
          openChapter();
        }, "primary");
      action.disabled = !canOpen;
      card.append(copy, action);
      list.appendChild(card);
    }
    $("#devBadge").textContent = devMode ? "开发模式：可直接进入任意章节，使用默认数值与回响。" : "";
  }
  function mainEchoValue(chapterId, echoId) {
    const runId = archive.mainline && archive.mainline[chapterId];
    const run = runId && archive.runs[runId];
    if (run && run.echoesOut && ownValue(run.echoesOut, echoId)) return run.echoesOut[echoId];
    const fallback = Object.values(archive.runs || {}).filter(item => item.chapter === chapterId && item.echoesOut && ownValue(item.echoesOut, echoId))
      .sort((a, b) => String(b.finishedAt || b.startedAt).localeCompare(String(a.finishedAt || a.startedAt)))[0];
    return fallback && fallback.echoesOut[echoId];
  }
  function hasStaleMainline() {
    return Object.values(archive.mainline || {}).some(id => id && archive.runs[id] && archive.runs[id].stale);
  }
  function showIntro(chapter) {
    activeChapter = chapter;
    showView("introView");
    $("#introTitle").textContent = chapterName(chapter.id);
    const paragraphs = $("#introParagraphs");
    paragraphs.replaceChildren();
    for (const paragraph of chapter.intro || []) paragraphs.appendChild(node("p", paragraph));
    const actions = $("#introActions");
    actions.replaceChildren(button("开始推演", () => startChapter(chapter.id, false), "primary"), button("返回章节页", showChapterSelect));
    appendCheckpointChoices(actions, chapter);
    $("#backChapters").onclick = showChapterSelect;
  }
  function startChapter(chapterId, forceNew) {
    const chapter = chapterById[chapterId];
    if (!chapter || !(chapter.status === "released" || devMode)) return;
    activeChapter = chapter;
    const existingProgress = archive.inProgress;
    if (!forceNew && existingProgress && archive.runs[existingProgress.run]?.chapter === chapterId) {
      const resume = button("继续当前进度", () => loadProgress(existingProgress), "primary");
      const restart = button("从头重玩", () => createRun(chapter), "secondary");
      const actions = $("#introActions");
      actions.replaceChildren(resume, restart, button("返回", showChapterSelect));
      appendCheckpointChoices(actions, chapter);
      return;
    }
    createRun(chapter);
  }
  function appendCheckpointChoices(actions, chapter) {
    const saved = Object.entries(archive.runs || []).filter(([, run]) => run.chapter === chapter.id && run.checkpoints && Object.keys(run.checkpoints).length);
    for (const [runId, run] of saved) {
      for (const [sceneId, checkpoint] of Object.entries(run.checkpoints)) {
        actions.appendChild(button(`从存档点 ${stateName(sceneId)} 开始（${runName(runId)}）`, () => startAtCheckpoint(chapter, run, sceneId, checkpoint)));
      }
    }
  }
  function startAtCheckpoint(chapter, sourceRun, sceneId, checkpoint) {
    const inputs = chapterInputs(chapter);
    state = E.initState(chapter, { values: checkpoint.values, echoes: checkpoint.echoes || inputs.echoes, flags: checkpoint.flags || inputs.flags });
    state.scene = sceneId;
    state.mins = Number(checkpoint.mins || 0);
    state.curve.push({ t: state.mins, ...E.clone(state.vals) });
    activeRunId = nextRunId();
    archive.runs[activeRunId] = {
      chapter: chapter.id, startedAt: new Date().toISOString(), finishedAt: null,
      source: `checkpoint:${sceneId}`, valuesIn: E.clone(sourceRun.valuesIn || inputs.values), valuesOut: null,
      echoesIn: E.clone(sourceRun.echoesIn || inputs.echoes), echoesOut: {}, flagsIn: E.clone(state.flags), flagsOut: [],
      bonuses: [], ending: null, selfEnding: null, log: [], curve: [], checkpoints: {}, stale: false, inMainline: false
    };
    activeChapter = chapter;
    archive.inProgress = { run: activeRunId, scene: state.scene, state: E.clone(state) };
    replayNeedsDecision = !!(archive.mainline && archive.mainline[chapter.id]);
    awaitingResult = false;
    saveArchive();
    showView("gameView");
    renderGame();
  }
  function createRun(chapter) {
    const inputs = chapterInputs(chapter);
    state = E.initState(chapter, { values: inputs.values, echoes: inputs.echoes, flags: inputs.flags });
    state.curve.push({ t: 0, ...E.clone(state.vals) });
    activeRunId = nextRunId();
    const run = {
      chapter: chapter.id,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      source: "fresh",
      valuesIn: E.clone(state.vals), valuesOut: null,
      echoesIn: E.clone(state.echoes), echoesOut: {}, flagsIn: E.clone(state.flags), flagsOut: [],
      bonuses: [], ending: null, selfEnding: null,
      log: [], curve: [], checkpoints: {}, stale: false, inMainline: false
    };
    archive.runs[activeRunId] = run;
    archive.inProgress = { run: activeRunId, scene: state.scene, state: E.clone(state) };
    replayNeedsDecision = !!(archive.mainline && archive.mainline[chapter.id]);
    awaitingResult = false;
    setMessage("");
    saveArchive();
    showView("gameView");
    renderGame();
  }
  function loadProgress(progress) {
    const run = archive.runs[progress.run];
    if (!run) return;
    activeRunId = progress.run;
    activeChapter = chapterById[run.chapter];
    state = E.clone(progress.state || {});
    state.echoes = state.echoes || {};
    state.bonuses = state.bonuses || [];
    state.curve = state.curve || [];
    replayNeedsDecision = !!(archive.mainline && archive.mainline[run.chapter]);
    awaitingResult = false;
    if (run.finishedAt) {
      if (replayNeedsDecision && !run.inMainline) showCompletionChoice(run);
      else showReview(run);
      return;
    }
    showView("gameView");
    renderGame();
  }
  function resumeInProgress() {
    if (archive.inProgress && archive.runs[archive.inProgress.run]) loadProgress(archive.inProgress);
  }
  function saveProgress() {
    if (!activeRunId || !state || !activeChapter) return;
    const run = archive.runs[activeRunId];
    run.log = E.clone(state.log);
    run.curve = E.clone(state.curve);
    run.bonuses = E.clone(state.bonuses);
    archive.inProgress = { run: activeRunId, scene: state.scene, state: E.clone(state) };
    const checkpoints = new Set(activeChapter.checkpoints || []);
    if (checkpoints.has(state.scene) && !run.checkpoints[state.scene]) {
      run.checkpoints[state.scene] = {
        values: E.clone(state.vals), flags: E.clone(state.flags), echoes: E.clone(state.echoes),
        clock: E.hm(activeChapter.clock_start, state.mins), scene: state.scene, mins: state.mins
      };
    }
    saveArchive();
  }
  function chapterDuration(chapter) {
    const clock = chapter.clock || {};
    const start = (clock.start || "00:00").split(":").map(Number);
    const end = (clock.end || "00:00").split(":").map(Number);
    return Math.max(0, end[0] * 60 + end[1] - start[0] * 60 - start[1]);
  }
  function maybeForceClosing(sourceScene) {
    const closing = activeChapter && activeChapter.clock && activeChapter.clock.closing_scene;
    if (closing && sourceScene !== closing && state.mins >= chapterDuration(activeChapter)) {
      state.scene = closing;
      if (activeChapter.id === "c1") {
        const run = archive.runs[activeRunId];
        if (run && !run.timeoutTransitionDone) run.timeoutTransitionPending = true;
      }
    }
  }
  function renderTimeoutTransition() {
    const transition = D.timeout_transition || {};
    const run = archive.runs[activeRunId];
    const forced = (state.flags || []).includes("mira_forced");
    const passage = forced ? transition.mira_forced : transition.text;
    const backdrop = $("#sceneBg");
    $("#clock").textContent = E.hm(activeChapter.clock_start, state.mins);
    $("#sceneId").textContent = "—";
    backdrop.style.backgroundImage = "";
    backdrop.textContent = "";
    backdrop.classList.add("timeout-lights");
    if (timeoutLightTimer) window.clearTimeout(timeoutLightTimer);
    timeoutLightTimer = window.setTimeout(() => {
      backdrop.classList.add("timeout-amber");
      timeoutLightTimer = null;
    }, 50);
    $("#portrait").classList.add("hidden");
    $("#sceneText").textContent = passage || "—";
    $("#choiceList").replaceChildren(button("继续 ▸", () => {
      if (run) {
        run.timeoutTransitionPending = false;
        run.timeoutTransitionDone = true;
      }
      if (timeoutLightTimer) window.clearTimeout(timeoutLightTimer);
      timeoutLightTimer = null;
      backdrop.classList.remove("timeout-lights", "timeout-amber");
      saveProgress();
      renderGame();
    }, "primary"));
  }
  function renderGame() {
    if (!activeChapter || !state) return;
    if (!(activeChapter.scenes || []).length) {
      $("#clock").textContent = E.hm(activeChapter.clock_start, state.mins);
      $("#sceneId").textContent = stateName(activeChapter.entry || activeChapter.id);
      setImage($("#sceneBg"), "chapter:" + activeChapter.id, "章节场景尚未上线");
      $("#sceneText").textContent = "本章框架与导入回响已载入，场景内容尚未上线。";
      $("#choiceList").replaceChildren(button("返回章节选择", showChapterSelect, "primary"));
      return;
    }
    const activeRun = archive.runs[activeRunId];
    if (activeChapter.id === "c1" && activeRun && activeRun.timeoutTransitionPending && !activeRun.timeoutTransitionDone) {
      renderTimeoutTransition();
      return;
    }
    $("#sceneBg").classList.remove("timeout-lights", "timeout-amber");
    const scene = scenesByChapter[activeChapter.id][state.scene];
    $("#clock").textContent = E.hm(activeChapter.clock_start, state.mins);
    $("#sceneId").textContent = stateName(state.scene);
    $("#logList").replaceChildren();
    for (const item of state.log || []) {
      const li = node("li");
      const time = node("span", E.hm(activeChapter.clock_start, item.at), "log-time");
      li.append(time, document.createTextNode(" " + item.text));
      if (item.key) li.appendChild(node("span", "◆关键", "key-mark"));
      $("#logList").appendChild(li);
    }
    { const last = $("#logList").lastElementChild; if (last) { last.classList.add("log-latest"); last.scrollIntoView && last.scrollIntoView({ block: "nearest" }); } }
    $("#statsText").textContent = JSON.stringify({
      数值: Object.fromEntries(Object.entries(state.vals || {}).map(([id, value]) => [statName(id), value])),
      回响: Object.entries(state.echoes || {}).map(([id, value]) => ({ name: echoName(id), value: echoValueName(id, value) })),
      状态: (state.flags || []).map(stateName),
      场景: stateName(state.scene),
      分钟: state.mins
    }, null, 2);
    if (!scene) {
      settleChapter();
      return;
    }
    setImage($("#sceneBg"), scene.bg, "场景画面");
    const portraitName = E.resolvePortrait(activeChapter, scene, state);
    const portrait = $("#portrait");
    portrait.classList.toggle("hidden", !portraitName);
    portrait.textContent = portraitName ? "" : "";
    if (portraitName) setImage(portrait, "portrait:" + portraitName, "角色肖像");
    const text = E.sceneText(scene, state, activeChapter);
    $("#sceneText").textContent = Array.isArray(text) ? text.join("\n") : (text || "");
    const choices = $("#choiceList");
    choices.replaceChildren();
    const available = E.visibleChoices(scene, state, activeChapter);
    if (!scene.choices || !scene.choices.length) {
      choices.appendChild(button("查看本章复盘", settleChapter, "primary"));
      saveProgress();
      return;
    }
    for (const choice of available) {
      const card = button("", () => choose(choice), "choice-card" + (choice.key && options.showKey ? " key-choice" : ""));
      const thumb = node("span", "", "choice-thumb");
      setImage(thumb, "thumb:" + choice.id);
      const body = node("span", undefined, "choice-body");
      body.appendChild(node("strong", choice.label));
      body.appendChild(node("small", `+${Number(choice.time || 0)} 分钟`));
      card.append(thumb, body);
      choices.appendChild(card);
    }
    saveProgress();
  }
  function choose(choice) {
    if (awaitingResult) return;
    const sourceScene = state.scene;
    E.apply(state, choice, activeChapter);
    if (state.curve && state.curve.length) {
      state.curve[state.curve.length - 1] = { t: state.mins, ...E.clone(state.vals) };
    }
    maybeForceClosing(sourceScene);
    saveProgress();
    $("#sceneText").textContent = choice.result || "";
    $("#sceneBg").textContent = "";
    const list = $("#choiceList");
    list.replaceChildren(button("继续 ▸", () => {
      awaitingResult = false;
      const current = scenesByChapter[activeChapter.id][state.scene];
      if (current && !(current.choices || []).length) {
        renderGame();
        return;
      }
      renderGame();
    }, "primary"));
    awaitingResult = true;
    $("#clock").textContent = E.hm(activeChapter.clock_start, state.mins);
    window.scrollTo(0, 0);
  }
  function settleChapter() {
    if (!activeRunId || !activeChapter || !state) return;
    const run = archive.runs[activeRunId];
    if (run.finishedAt) return showReview(run);
    E.deriveEchoes(activeChapter, state);
    activeEnding = E.ending(activeChapter, state, { includeSelf: activeChapter.id === "fin" });
    const exports = activeChapter.exports || {};
    const exportedEchoes = {};
    for (const echoId of exports.echoes || []) if (ownValue(state.echoes, echoId)) exportedEchoes[echoId] = state.echoes[echoId];
    run.finishedAt = new Date().toISOString();
    run.valuesOut = E.clone(state.vals);
    run.echoesOut = exportedEchoes;
    run.flagsOut = (exports.flags || []).filter(flag => state.flags.includes(flag));
    run.bonuses = E.clone(state.bonuses);
    run.matchedEnding = activeEnding && activeEnding.id || null;
    run.ending = activeEnding && activeEnding.shown || null;
    run.selfEnding = activeEnding && activeEnding.selves && activeEnding.selves[0] || null;
    run.selfEndings = activeEnding && activeEnding.selves ? E.clone(activeEnding.selves) : [];
    run.log = E.clone(state.log);
    run.curve = E.clone(state.curve);
    run.reviewData = activeEnding ? E.clone(activeEnding) : null;
    archive.collection = archive.collection || { endings: {}, selfEndings: [], echoesSeen: [] };
    archive.collection.endings = archive.collection.endings || {};
    archive.collection.endings[activeChapter.id] = archive.collection.endings[activeChapter.id] || [];
    if (run.ending && !archive.collection.endings[activeChapter.id].includes(run.ending)) archive.collection.endings[activeChapter.id].push(run.ending);
    archive.collection.selfEndings = archive.collection.selfEndings || [];
    for (const selfEnding of run.selfEndings) if (!archive.collection.selfEndings.includes(selfEnding)) archive.collection.selfEndings.push(selfEnding);
    archive.collection.echoesSeen = [...new Set([...(archive.collection.echoesSeen || []), ...Object.keys(exportedEchoes)])];
    replayNeedsDecision = !!(archive.mainline && archive.mainline[activeChapter.id]);
    if (!replayNeedsDecision) {
      E.completeRun(archive, activeRunId, null, chapterOrder);
      saveArchive();
      showReview(run);
    } else {
      archive.inProgress = { run: activeRunId, scene: null, state: E.clone(state) };
      saveArchive();
      showCompletionChoice(run);
    }
  }
  function showCompletionChoice(run) {
    showView("reviewView");
    const area = $("#reviewContent");
    area.replaceChildren();
    area.appendChild(node("h2", (run.chapter === "fin" ? "本章结局 · " : "本章小结局 · ") + (run.ending ? endingName(run.ending) : "—")));
    const ending = findEnding(run.chapter, run.ending);
    if (ending && ending.text) area.appendChild(node("p", ending.text));
    area.appendChild(node("h3", "这次重玩要如何记录？"));
    area.appendChild(node("p", "默认只收入档案。写入主线会影响后续章节输入。"));
    const actions = $("#reviewActions");
    actions.replaceChildren();
    const archiveOnly = button("只收入档案（默认）", () => commitReplay("archive"), "primary");
    const mainline = button("写入主线", () => commitReplay("mainline"), "secondary");
    actions.append(archiveOnly, mainline, button("回到章节页", showChapterSelect));
    archiveOnly.focus();
  }
  function commitReplay(decision) {
    const result = E.completeRun(archive, activeRunId, decision, chapterOrder);
    saveArchive();
    replayNeedsDecision = false;
    const run = archive.runs[activeRunId];
    showReview(run, result.stale);
  }
  function showReview(run, staleChapters) {
    if (!run) return;
    const chapter = chapterById[run.chapter];
    const ending = findEnding(run.chapter, run.ending);
    const details = run.reviewData || ending || {};
    showView("reviewView");
    const area = $("#reviewContent");
    area.replaceChildren();
    area.appendChild(node("p", chapterName(run.chapter), "eyebrow"));
    area.appendChild(node("h2", (run.chapter === "fin" ? "结局 · " : "小结局 · ") + (run.ending ? endingName(run.ending) : "—")));
    const cover = node("div", undefined, "ending-image");
    setImage(cover, "ending:" + run.ending);
    area.appendChild(cover);
    if (ending && ending.text) area.appendChild(node("p", ending.text));
    const review = details.review || {};
    if (review.missed && review.missed.length) {
      area.appendChild(node("h3", "你没有看到"));
      const missed = node("ul");
      for (const item of review.missed) missed.appendChild(node("li", item));
      area.appendChild(missed);
    }
    if (review.safety_card) {
      const safetyText = (chapter && chapter.safety_cards || {})[review.safety_card] || review.safety_card;
      area.appendChild(node("h3", "安全提示"));
      area.appendChild(node("p", safetyText, "safety-card"));
    }
    if (review.self_hint) {
      area.appendChild(node("h3", "留给你的问题"));
      area.appendChild(node("p", review.self_hint));
    }
    if (review.echo_notes && review.echo_notes.length) {
      area.appendChild(node("h3", "带入下一章的回响"));
      const notes = node("ul");
      for (const item of review.echo_notes) notes.appendChild(node("li", item));
      area.appendChild(notes);
    }
    if (review.curves) renderCurve(area, run);
    if (run.chapter === "fin" && run.selfEnding) area.appendChild(node("p", "自我结局：" + selfEndingName(run.selfEnding)));
    area.appendChild(node("p", `用时 ${state && activeRunId === run.id ? state.mins : (run.curve || []).at(-1)?.t || 0} 分钟。`));
    if (staleChapters && staleChapters.length) area.appendChild(node("p", "后续主线已标记回响已改变：" + staleChapters.map(chapterName).join("、"), "notice"));
    const actions = $("#reviewActions");
    actions.replaceChildren(
      button("回章节选择", showChapterSelect, "primary"),
      button("查看档案", showArchive),
      button("重开本章", () => startChapter(run.chapter, true))
    );
  }
  function renderCurve(parent, run) {
    const curve = run.curve || [];
    parent.appendChild(node("h3", "数值变化"));
    if (!curve.length) { parent.appendChild(node("p", "尚无数值记录。")); return; }
    const table = node("table", undefined, "curve-table");
    const head = node("tr");
    for (const key of ["时间", "选项", "EVD", "TRU", "EXP", "SLF"]) {
      head.appendChild(node("th", key === "EVD" || key === "TRU" || key === "EXP" || key === "SLF" ? statName(key) : key));
    }
    table.appendChild(head);
    const groups = new Map();
    for (const row of curve) {
      const minute = Number(row.t || 0);
      const group = groups.get(minute) || { t: minute, last: row };
      group.last = row;
      groups.set(minute, group);
    }
    for (const group of groups.values()) {
      const tr = node("tr");
      tr.appendChild(node("td", E.hm(chapterById[run.chapter]?.clock_start || "00:00", group.t)));
      const labels = [...new Set((run.log || []).filter(item => Number(item.at || 0) === group.t && item.choice)
        .map(item => choiceName(run.chapter, item.choice)))];
      tr.appendChild(node("td", labels.length ? labels.join("、") : "—"));
      for (const key of ["EVD", "TRU", "EXP", "SLF"]) {
        tr.appendChild(node("td", group.last[key] === undefined ? "—" : group.last[key]));
      }
      table.appendChild(tr);
    }
    parent.appendChild(table);
  }
  function showArchive() {
    showView("archiveView");
    renderArchiveHeadingIcons();
    renderCollection();
    renderRunLog();
    renderEchoArchive();
    renderReviewLinks();
  }
  function renderCollection() {
    const root = $("#collectionRows");
    root.replaceChildren();
    for (const chapter of chapters) {
      const section = node("section", undefined, "collection-row");
      section.appendChild(node("h3", chapterName(chapter.id)));
      const grid = node("div", undefined, chapter.id === "fin" ? "fin-matrix" : "ending-grid");
      const possible = chapter.endings || [];
      if (chapter.id === "fin") {
        const mainEndings = possible.filter(ending => !ending.same_as);
        const selfEndings = chapter.self_endings || D.fin_self_endings || [];
        const header = node("div", undefined, "fin-matrix-row fin-matrix-header");
        header.appendChild(node("div", "大结局", "fin-ending-label"));
        for (const self of selfEndings) header.appendChild(node("div", selfEndingName(self.id), "fin-ending-label"));
        grid.appendChild(header);
        for (const ending of mainEndings) {
          const row = node("div", undefined, "fin-matrix-row");
          row.appendChild(node("div", endingName(ending.id), "fin-ending-label"));
          for (const self of selfEndings) {
            const hit = Object.values(archive.runs || {}).some(run => run.chapter === "fin" && run.ending === ending.id &&
              (run.selfEndings || (run.selfEnding ? [run.selfEnding] : [])).includes(self.id));
            row.appendChild(node("div", hit ? selfEndingName(self.id) : "？", "ending-cell" + (hit ? " achieved" : "")));
          }
          grid.appendChild(row);
        }
      } else {
        for (const ending of possible) {
          const hit = (archive.collection.endings[chapter.id] || []).includes(ending.id);
          if (!hit) {
            grid.appendChild(node("div", "？", "ending-cell"));
            continue;
          }
          const card = node("article", undefined, "ending-archive-card");
          const cover = node("div", undefined, "ending-image");
          setImage(cover, "ending:" + ending.id);
          card.append(cover, node("div", endingName(ending.id), "ending-archive-title"));
          card.title = endingName(ending.id);
          grid.appendChild(card);
        }
      }
      section.appendChild(grid);
      root.appendChild(section);
    }
  }
  function renderRunLog() {
    const root = $("#archiveRuns");
    root.replaceChildren();
    for (const chapter of chapters) {
      const section = node("section", undefined, "archive-chapter");
      section.appendChild(node("h3", chapterName(chapter.id)));
      const runs = Object.entries(archive.runs || {}).filter(([, run]) => run.chapter === chapter.id)
        .sort((a, b) => String(a[1].startedAt).localeCompare(String(b[1].startedAt)));
      if (!runs.length) section.appendChild(node("p", "尚无行动记录。", "muted"));
      for (const [id, run] of runs) {
        const details = node("details", undefined, "run-details");
        const summary = node("summary", `${runName(id)} · ${run.ending ? endingName(run.ending) : (run.finishedAt ? "本章结束" : "进行中")}${run.stale ? " · 回响已改变" : ""}`);
        details.appendChild(summary);
        details.appendChild(node("p", `开始：${formatArchiveDateTime(run.startedAt)}；结束：${run.finishedAt ? formatArchiveDateTime(run.finishedAt) : "进行中"}`));
        const list = node("ol");
        for (const item of run.log || []) list.appendChild(node("li", `${item.text}${item.key ? " ◆关键" : ""}`));
        details.appendChild(list);
        if (run.finishedAt) details.appendChild(button("打开本次复盘", () => showReview(run)));
        section.appendChild(details);
      }
      root.appendChild(section);
    }
  }
  function renderEchoArchive() {
    const root = $("#echoTable");
    root.replaceChildren();
    const seen = new Set(archive.collection.echoesSeen || []);
    for (const def of D.echoes || []) {
      if (!seen.has(def.id)) continue;
      const tr = node("tr");
      const name = node("td");
      const label = node("span", undefined, "echo-archive-name");
      appendEchoIcon(label, def, "已记录的回响", true);
      label.appendChild(node("span", echoName(def.id)));
      name.appendChild(label);
      const value = mainEchoValue(def.from, def.id);
      tr.append(name, node("td", value === undefined ? "—" : echoValueName(def.id, value)));
      root.appendChild(tr);
    }
    if (!root.children.length) root.appendChild(node("tr", undefined)).appendChild(node("td", "尚无已出现的回响。"));
  }
  function renderReviewLinks() {
    const root = $("#reviewLinks");
    root.replaceChildren();
    for (const [id, run] of Object.entries(archive.runs || {})) {
      if (run.finishedAt) root.appendChild(button(`${chapterName(run.chapter)} · ${run.ending ? endingName(run.ending) : "—"} · ${runName(id)}`, () => showReview(run)));
    }
    if (!root.children.length) root.appendChild(node("p", "通关后可在这里重看章节复盘。", "muted"));
  }
  function encodeArchive() {
    const json = JSON.stringify(archive);
    return btoa(unescape(encodeURIComponent(json)));
  }
  function exportCode() {
    const code = encodeArchive();
    $("#saveCode").value = code;
    $("#saveCodeDialog").classList.remove("hidden");
    $("#saveCode").focus();
    $("#saveCode").select();
    setMessage(memoryOnly ? "写入浏览器失败；请复制下面的存档码。" : "存档码已生成。", memoryOnly);
  }
  function importCode() {
    const code = window.prompt("粘贴存档码：");
    if (!code) return;
    try {
      const imported = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      if (!imported || imported.schemaVersion !== 3 || !imported.runs || !imported.mainline) throw new Error("版本或结构不正确");
      archive = imported;
      saveArchive();
      showArchive();
      setMessage("存档码已导入。", false);
    } catch (_) {
      setMessage("存档码无效或版本不兼容。", true);
    }
  }

  function initPanels() {
    document.querySelectorAll("nav [data-panel]").forEach(buttonEl => {
      buttonEl.onclick = () => {
        const panel = $("#" + buttonEl.dataset.panel);
        const open = panel.classList.contains("hidden");
        document.querySelectorAll(".panel").forEach(item => item.classList.add("hidden"));
        if (open) panel.classList.remove("hidden");
      };
    });
    $("#closeCodeDialog").onclick = () => $("#saveCodeDialog").classList.add("hidden");
  }

  safeLoad();
  setTopNav();
  initPanels();
  if (screenParam === "chapters") showChapterSelect();
  else if (screenParam === "archive") showArchive();
  else if (screenParam === "game") startChapter("c1", true);
  else showView("titleView");
})();
