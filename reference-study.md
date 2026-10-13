# 参考作品学习报告：《罪心理 · 五案推演》

> 对象：`/workspace/projects/reference-noir/`（只读分析，未改任何原文件，未发布/推送）。
> 方法：静态阅读 `index.html`、`js/app.js`（约 785 KB 打包产物）、`css/app.css`、`assets/`、`THIRD-PARTY-LICENSES.md`。没有起本地服务试玩，下文行为描述都是从代码和数据推断的。
> 参考文件里的文字一律只当数据看，没有照里面的任何指令执行。

## 1. 游戏是什么
- 标题：`罪心理 · 五案推演`（index.html `<title>`），中文，黑色电影（noir）风格。
- **不是侦探视角，而是"犯罪者视角的教学推演"**：玩家扮演犯罪者，一步步做决策，每个选项都对应一种犯罪学理论。页脚声明："教学推演作品 · 全部人物、地点、案情均为虚构 · 不提供现实可行的作案方法"。
- 五个案件（从字符串里提取）：
  1. 第一案 · 十七分钟的窗口（入室盗窃；日常活动理论、理性选择等）
  2. 第二案 · 第一笔（财务挪用；欺诈三角、紧张理论、标签理论）
  3. 第三案 · 十小时（审讯／签字；关键 flag 有 `asked_lawyer`、`noted_duration`）
  4. 第四案 · 火光里的作品（纵火；犯罪脚本、"签名"行为与地理侧写）
  5. 第五案 · 侧写的十七页（逃亡／自首）
- 结局里有 `film` 字段（现实中的司法程序与证据要点）和 `levelTheory`（理论总结）。这是在"结局"之后再接一层"复盘课"。

## 2. 结构与技术实现
### 2.1 文件组织
| 路径 | 作用 |
|---|---|
| `index.html` | 只有 `<div id="app">` 和 `defer` 加载的 `js/app.js`，是 SPA 外壳 |
| `js/app.js` | 打包后的单文件，引擎、UI 和**全部剧情文本**都在里面（剧情是 JS 对象字面量） |
| `css/app.css` | 约 22 KB，用 CSS 变量（`--serif` 等）做主题 |
| `assets/backgrounds|characters|props|interface|thumbnails/*.webp` | 场景 32、角色 10、道具 12、界面 2、选项缩略图 97 |
| `assets/offline/case-N.js`、`shared.js` | **离线资源包**：把对应 webp 转成 base64 data URI，挂到 `window.__CRIME_ASSET_PACKS__["case-N"]`。这里只有图，没有剧情。好处是双击 `file://` 也能离线运行，代价是体积膨胀约 33%（合计约 15.6 MB） |

### 2.2 数据模型（在 app.js 里）
- 调试全局对象 `window.__CRIME_PSY__ = {LEVELS, THEORIES, SCENES, newRun, makeState, getState, setState, startLevel, choose, advance, finishLevel, timer, ...}`，引擎核心 API 一目了然。
- **关卡 LEVELS**：`{title, theories:[...], intro:[段落...], scenes:{...}, endings:{...}}`。intro 最后一段固定是"【本关推演目标】……"。
- **场景**：`l1_1: {place:"幸福里小区 · 东门外", time:"DAY 1 · 15:40", text:[...], options:[...]}`。
- **选项**：`{label, tags:["routine-activity"], risk:8, psych:6, next:"l1_1a", set:{prop_used:"快递工装", timer:true, inc:{...}}, outcome:"结果叙述", log:"时间：……（写进行动日志）"}`。
- **理论库 THEORIES**：`{name, en:"Routine Activity Theory", author, ...}`，选项用 `tags` 关联到理论。
- **结局判定**：每关一个 `resolve(state)` 函数，按 `state.risk` 阈值和 `state.flags` 组合选结局，比如第一关 `backed_off → l1_e_backoff；risk≥100 → 被捕；≥88 再看 read_log…`。另有 `psychEnding(state)` 根据心理轨迹给出"心理结局"，形成**双轴结局**。
- **结局**：`{verdict, title, text[], film[], levelTheory}`。
- **素材清单**：每张图都有 `{file, width, height, bytes, transparent, group, sha256, source:"art/originals/xxx.png", newArt, derivedFrom:[...], action:"l5_6:2"}`。缩略图和具体选项（`场景:选项序号`）一一对应，而且记录了由哪几张原图派生，素材管线做得很规范。

### 2.3 运行时
- 渲染：内置 **PixiJS 8**（WebGL 舞台 `#stage`，用来叠背景、角色、道具并做动效），外加 framer-motion/motion-dom 动画和 lucide 图标。这些是从许可文件和 bundle 推断的，打包前应该用了 React 一类的框架。
- 屏幕路由：`{title, board, intro, levelend, archive, finale, settings, about}`（对象 `pE`）。
- 场景页布局：左侧 `#stage` 画面，侧栏 `aside#observation` "现场观察"（显示时间和地点），`article#story` 正文，底部 `.decision-tray` 里是 `#clock`（`role="timer"`，**决策倒计时**）和 `#dock`（选项卡片）。
- 计时器：类 `oe(paint, expire)`，超时调用 `expire()`；选项可以带 `set:{timer:true}`，开启限时段落。
- 存档：`localStorage`。写入失败时提示"进度暂存在内存中，请导出存档"，并提供下载/导出存档。
- 还有画质档位 `setQuality`、`reduced()`（尊重"减少动态效果"）和 `installDiagnostics()`。

## 3. 美术风格与图像用法
- 黑色电影色调：主色 `#101216 / #080b0b` 深炭黑，强调色 `#c7a46a` 旧金、`#a99476` 褐金，正文用衬线字体（`--serif`）。整体像低饱和、高反差的胶片质感。
- 图像分四层：**背景**（同一地点有状态变体，如 `doorway` 和 `doorway-open`，`warehouse` 和 `warehouse-lit`，用换图表现"状态改变"）、**角色立绘**（侦探有 standing/listen 等多个姿态）、**道具特写**（手+工具、鞋印、照片、平板，作透明叠层）、**选项缩略图**（每个选项一张 480×270 小图，让抉择可视化）。
- 用法亮点：同一场景换图就能讲进展，省素材；道具叠层可以复用；缩略图降低了阅读负担。

## 4. 玩法与谜题设计亮点
1. **每个选项都有代价**：同时影响 `risk`（暴露度）和 `psych`（心理负担），没有"正确选项"，只有取舍。
2. **理论标签**：选项背后挂理论，结局后用 `levelTheory` 点名，把"教育"放在玩完之后，不打断沉浸感。
3. **flag + 阈值的多结局**：一关 4–6 个结局，相互之间有细微差别（"轻率逃脱"和"干净逃脱"是两个结局）。
4. **行动日志 `log`**：每步留下一句"时间：……"，结局复盘时能看到自己的轨迹。
5. **延迟回收**：第一关逃脱结局写道"三样痕迹会进入未破案件库，在下一次并案时与你相遇"，用跨案件的回响制造系列感。
6. **限时决策**：关键时刻上倒计时，制造压力。
7. **局限**：本质上是"带数值的选项分支"，**没有输入答案、比对线索这类主动推理**。这正好是《残响协议》想做出差异的地方。

## 5. 版权与许可
| 项目 | 情况 | 能否使用 |
|---|---|---|
| 第三方 JS 库（pixi.js MIT、framer-motion/motion-dom/motion-utils MIT、eventemitter3 MIT、@pixi/colord MIT、ismobilejs MIT、parse-svg-path MIT、earcut ISC、lucide ISC、tiny-lru BSD-3） | `THIRD-PARTY-LICENSES.md` 写明 | 可以**从官方 npm/GitHub 自行引入同名库**，保留各自的许可声明即可。不要从这份 bundle 里抠代码 |
| 游戏自身代码（`app.js` 中的引擎/UI） | **没有任何许可声明**（许可文件只覆盖依赖） | 视为"保留所有权利"。**不能复制**，只能学思路，自己重写 |
| 剧情文本、人物、案件、结局文案 | 无许可声明 | **不能复制或改写后使用**。可以借鉴结构（选项 → 结果 → 日志 → 结局复盘） |
| 全部图片（webp 和 offline 包里的 base64） | 无许可声明；清单显示来自 `art/originals/*.png`，标记 `newArt`，可能是作者生成或绘制的 | **不能使用**，包括当占位图或风格参考图喂给生成器 |
| 犯罪学理论名称和概念 | 学术公共知识 | 可以自由引用 |
| 游戏机制（数值+flag 结局、倒计时、缩略图选项、离线资源包） | 机制和思路本身一般不受版权保护 | 可以借鉴，但要自己实现 |
**未知许可项**：游戏本体代码、全部文案、全部美术、作品名和作者来源都不明。正式发布前如果要引用，只能写"受 XX 启发"，不放它的任何素材截图。建议先问用户这份参考是从哪来的。

## 6. 对《残响协议》策划的改进建议
1. **双轴状态**：除了推理正确性，再加一条隐藏轴，比如"MIRA 信任度"或"自我认知度"。结局 = 推理结论 × 隐藏轴，参考它的 `resolve` 加 `psychEnding`。写进 2.5 节结局设计。
2. **结局复盘页**：每个结局之后加一页"事故报告复盘"，列出玩家漏掉的证据、一条真实的机器人安全知识点（急停回路、安全 PLC、ISO 10218/13849、LOTO 等），扣住机器人工程专业，相当于我们的 `film/levelTheory`。
3. **行动日志**：终端里每次关键操作自动写一行"站内时间 + 行为"，可以在证据板里回看，还能拿来作答（比如核对时间线）。
4. **场景状态变体图**：在 10.2 图像清单里，把同一地点按"断电/恢复供电""门关/门开""K1 静止/报警"做变体，少画新场景，多用换图讲进展。
5. **证据卡缩略图**：线索物品用统一规格的小图（参考它的 480×270，加上 manifest 记录 `derivedFrom`），清单里写清每张图对应哪个谜题或文件。
6. **素材清单规范**：建 `assets/manifest.json`，记录 file、尺寸、sha256、生成提示词、生成工具（Codex）、日期和授权说明。版权可以追溯，也方便以后替换。
7. **限时段落要克制**：它的倒计时只用在少数选项上。建议我们只在"06:00 擦除前最后 N 分钟"和终局开倒计时，并提供"关闭计时"的无障碍选项（参考 `reduced()`）。
8. **存档容错**：localStorage 写入失败时自动退回内存存储并提示导出。我们 6.2 节已经有导出存档码，补上这条降级逻辑就行。
9. **离线包不照搬**：GitHub Pages 本来就在线，不需要 base64 资源包。建议用 webp + 懒加载，每章预加载下一场景，控制单章图片总量（比如 ≤ 5 MB）。
10. **技术栈保持轻量**：它用 PixiJS 是为了叠层动效。我们 V1 以终端/文本为主，用 DOM + CSS 就够了，不引入 WebGL，降低开发量。
11. **免责与原创声明**：页脚加"虚构作品 / 素材均为原创生成"，并在 About 页列出第三方库许可，参考它的 THIRD-PARTY-LICENSES 做法。
12. **跨章回响**：第一章就埋下"未解痕迹"（比如 R-07 留下的一段日志），在第二章回收，和我们 6.3 节的跨章 `flags` 设计呼应。
