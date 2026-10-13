# 需求 M2：章节制框架（前端与测试 → Codex）
项目根：/workspace/projects/text-mystery/ 。工作目录 prototype/。
**写权限**：只能修改/新增 prototype/ 内文件；另外只允许**新建**三个文件 chapters/index.yaml、chapters/echoes.yaml、chapters/foreshadow.yaml。不得修改或删除任何其他文件（story/、puzzle/、chapters/c1/、art/ 等都只读）。不得 git，不得联网安装依赖（pyyaml 已装；node 无第三方包）。所有命令加 timeout。
**必读**：../proposal-v5.md §A（第 12–278 行，冲突时以它为准）、../direction-v4.md、../decisions-N1-N5.md、../decisions-addendum-1.md（这两份优先级最高）、../puzzle/c1-balance-v3.md（只读来理解上限，**不要解析它**）、../puzzle/c1_effects_v1.yaml、../chapters/c1/endings_draft_v1.yaml，以及现有 prototype/ 全部代码（build.py、engine.js、app.js、test_paths.js 已支持 when/requires/hide_if、bonuses、portrait_overrides、overrides.yaml、图片查找等，要在此基础上扩展、不要退化）。

## 1. 数据文件（新建）
- chapters/index.yaml：按 proposal-v5 §A.9.1 写 c1（released，entry c1_s00a，clock 05:00–05:30，closing_scene c1_s04a，checkpoints，values_in.defaults，portrait_overrides mira_forced→mira_broken，exports）、c2/c3/c4（coming_soon，含 values_in.defaults、carry EXP add −20 min 0，imports/exports 按 §A.2/§A.9）、fin（unlock completed c1–c4，coming_soon）。c1 的 scenes 来源写为 story 段列表（见第 4 节），endings_file: chapters/c1/endings_draft_v1.yaml。
- chapters/echoes.yaml：§A.2 全部回响，含 values/default/derive/appears_in/icon。c1_mira 派生：mira_forced→forced，asked_pain→asked，其余→mended；c1_cache 由 c1_s04a 关键选项决定（先读 story/c1_s04 最新版看它用的是 echo_set 还是 flag，按实际写 derive）。
- chapters/foreshadow.yaml：按 §A.6 伏笔登记表逐条写 {id, type, set_in, used_in, note}，包括 trace_env、trace_arm。

## 2. 引擎（engine.js，浏览器/node 共用，仍禁止 eval/Function）
- 条件语法增加 `echo:c1_mira==forced`、`echo:c1_mira in [a,b]`，可与 flag/数值混用；when/endings/bonuses/portrait_overrides/text_variants 通用。
- 选项新增 `echo_set`（只允许 key:true，否则测试报警）、`requires_echo: {echo:[values]}`、`hide_if_echo`；与 when/requires/hide_if 独立实现，全部满足才显示。
- 场景 `text_variants: [{when, text}]` 按顺序取第一条满足者，否则 `text_by_echo`（简写：{echo:{value:[...], _:[...]}}），否则 `text`；text 可为字符串或数组。
- 章末：c1_s04a 结算后（或到达无 next 的收束点）按 echoes.yaml derive 派生本章回响（选项 echo_set 优先），再按章节 endings 顺序判定小结局。小结局**不是 Game Over**：显示结局 text + 复盘（missed / safety_card / self_hint / echo_notes / 数值曲线），然后回章节选择页。**自我结局只在终章结算**（N5），章节复盘只显示 self_hint。
- 跨章：下一章 valuesIn = 上一章主线 valuesOut 经 carry（EVD/TRU/SLF keep，EXP −20 下限 0，N4）；回响和导出 flag 取各来源章主线记录。values 支持 {init,min,max} 夹紧。

## 3. 前端（app.js / index.html / style.css，纯静态，无 CDN）
- 标题→**章节选择页**：章节卡（chapter_<id>_vN 3:4 图，缺图占位）、章名、前提、状态（未解锁剪影/即将开放/可游玩/已完成+小结局名/回响已改变）、底部回响小图标（缺图用小色点）。不开放跳章（N3）；URL 加 `?dev=1` 时开启开发模式：可进任意章，用回响 default 与 values_in.defaults。
- 章节导入页（intro 段落，最后一段为推演目标）。
- 游戏页：沿用现有功能（缩略图卡片、+N 分钟、key 标记设置默认关、日志里 key 行小标记、结果叙述、数值调试面板、时钟），立绘走 resolvePortrait。
- **档案页**：结局收集（每章一行格子，未达成“？”）、行动日志（按章→每次游玩可展开）、回响表（只列已出现过的）、复盘（可重开任一次游玩的章节复盘）、存档码导出/导入（base64 JSON）。
- **存档 v3**：localStorage `echo-protocol:v3:archive`，结构照 §A.9.5（runs/mainline/collection/inProgress/settings）；写入失败降级内存+提示导出码。首次通关自动写入主线；重玩通关时询问“写入主线 / 只收入档案”，**默认只收入档案**（N2）；写入主线且回响或导出 flag 与原主线不同→后续章节主线记录标 stale，章节卡显示“回响已改变，可重玩”；进终章时只提示不设门槛（N1）。段落存档点只在 checkpoints 开头。**旧存档迁移**：识别旧 key `cx_save`（单段状态）并迁移为一条 c1 inProgress run，迁移后保留旧 key 不删。

## 4. build.py
- 章节数据：c1 用 story/ 下各段最高版本（c1_s00-s01、c1_s02、c1_s03、c1_s04，段名 = 去掉 _draft_vN），段顺序自然排序；章节元数据来自 chapters/index.yaml，回响/伏笔来自 echoes/foreshadow；章节 endings 来自 index 的 endings_file（取同名最高版本）。原 puzzle/c1_endings_v1.yaml 的 7 结局归终章（fin_endings），c1 不使用。
- **数值唯一来源**：puzzle/c1_effects_vN.yaml 取最高版本，按选项 id 覆盖剧本 effects（不改 story 原文件）。剧本有而 yaml 无、或 yaml 有而剧本无：build **直接报错退出（非零）并列出全部 id**。不要解析任何 md。若存在 balance_c1_v3.json 保留不用。yaml 里的 key 若与剧本不一致，报警（不报错）。
- 输出 data.json/data.js（含 chapters、echoes、foreshadow、各章 scenes/endings、fin_endings、images）。图片查找沿用现规则（跳过 _draft_genimage，webp 优先，最高 vN），新增 chapter_<id>_vN、结局小卡 ending_<id>_vN、图标 icon_<echo icon>_vN、portrait_<名>_vN。

## 5. 测试 test_paths.js（按章节独立枚举，保留现有全部检查）
- 每章以 values_in.defaults + 导入回响 default 起跑，状态去重搜索；死路、卡死（所有可达状态至少一个可选项）、缺兜底无条件选项、未引用场景。
- flag 分类：本章设置本章使用 / **本章设置、后续章节使用**（依据 foreshadow.yaml 与 exports，不算问题）/ 设置了无人使用 / 引用了无人设置（属于未上线章节的单独归类）。
- 幅度报警（c1-balance-v3）：普通抉择 EVD 超 ±8、其他超 ±10；key 抉择 EVD 超 ±10、其他超 ±20；bonuses 超 ±5；echo_set 出现在非 key 选项。
- 第一章单线 EVD 超 30 报警（列出路径）；“自愿交出”（c1_s03b_give 或其 when 门槛 TRU>=50）是否可达，列一条可达路径；5 个小结局是否都能走到，每个给一条示例路径，走不到的列出原因。
- 回响派生覆盖：c1_mira 三值、c1_cache 三值是否都出现。
- 缺图清单：场景、缩略图、立绘（含 override 后）、章节卡 chapter_<id>（3:4）、结局小卡、回响图标。
- 引擎自检新增：echo 条件、requires_echo/hide_if_echo、text_variants 顺序与回退、text_by_echo 的 `_`、carry EXP−20 下限 0、stale 标记逻辑、默认“只收入档案”、旧存档迁移。自检失败才非零退出。
- 输出 test-report.txt。

## 验收
`timeout 60 python3 build.py && timeout 180 node test_paths.js` 成功；`node -e "require('./engine.js')"` 正常；node --check app.js。完成后简述改动与已知问题。

## 补充（美术 M3 已出图，接入）
- 小结局图：art/out/ending_<结局id>_vN.(webp|png)，对照 chapters/c1/endings_draft_v1.yaml 的 id（如 ending_C1_E_CRACK_v1）；结局 yaml 里的 `image` 字段（如 bg/bay7_emergency）作后备。art/out 里存在但对不上任何结局 id 的 ending_* 文件，测试报告单独列出。
- 章节卡：art/out/chapter_<章id>_vN，3:4 竖卡，用在章节选择页（CSS aspect-ratio 3/4，object-fit cover）。
- 档案页/章节卡图标：art/out/icons/*.svg（按文件名去掉 _vN 和扩展名匹配 echoes.yaml 的 icon 名；也允许无版本号）。列出 icons 里未被引用的和被引用却缺失的。
- 一律取最高版本号（如左臂两张和环境日志缩略图有 v2，v1 作废）；美术会继续出 v2，重新 build 即生效。
