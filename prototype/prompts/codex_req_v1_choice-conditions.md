# 需求 v1：选项显示条件 / 卡死检测 / 图片目录排除（前端与测试 → Codex）
工作目录：/workspace/projects/text-mystery/prototype/ 。**只能修改或新增本目录内文件**，不得改动上级目录任何文件，不得执行 git，不得联网安装依赖。现有文件：build.py（yaml→data.json/data.js）、engine.js（浏览器与 node 共用逻辑）、app.js（UI）、test_paths.js（分支遍历测试）、index.html、style.css。先通读它们和 ../direction-v3.md 第 200–290 行（schema 与约定），以及 ../story/c1_s02_draft_v1.yaml（真实使用了 hide_if 的枢纽场景）。

## 1. 选项显示条件（engine.js + app.js）
- 新增 `E.visibleChoices(scene, st)`，UI 与测试都只用它取可选项。
- 字段：
  - `requires`：若为数组 → 列出的 flag 全部已设置才显示；若为字符串 → 视为条件表达式（同 endings 的 when）。
  - `when`：与 `requires` 同义（数组或字符串都支持）；两者都写则都须满足。
  - `hide_if`：数组 → 任一 flag 已设置即隐藏；字符串 → 表达式为真即隐藏。
  - 不满足的选项隐藏（不渲染）。
- 条件求值改为**不使用 eval/Function** 的极小解析器（direction-v3 约定），支持：`&& || !`、括号、`true/false`、`flag:名`、数值比较 `EVD >= 70`（> >= < <= == !=）、键值 flag `cause==K1`（flag 中存在 `cause=K1`）、`culprit in [ZHOU,SYSTEM]`；以及对象形式 `{all:[...]}`、`{any:[...]}`（元素为字符串或嵌套对象）。解析失败返回 false 并 console.warn 一次。
- values 若写成 `{init,min,max}`，初值取 init，effects 结算后按 min/max 夹紧；仍兼容纯数字写法。
- 场景 `text` 可能是字符串或字符串数组（数组按段落 join "\n"）。
- 回到同一枢纽场景时正常重渲染（已查项因 hide_if 消失）。

## 2. 测试（test_paths.js）
- 遍历改为基于状态去重的搜索（键 = scene + 排序后的 flags + vals + 已发 bonuses；分钟可不入键但要记录范围），防止枢纽循环导致爆炸；路径数照常统计（可设上限 200000，超出则报告“已截断”）。
- **卡死检测**：对每个可达状态，若当前场景存在且 `visibleChoices` 为空，且该场景本来就有 choices（即被条件全部隐藏），报“卡死: 场景id + 触发状态的 flags”。无 choices 的场景按原逻辑当终点。每个场景只列一次示例状态，计数所有出现次数。
- 报告新增：每个场景“可达状态数 / 卡死次数”；引用了 requires/when/hide_if 中的 flag 但数据里无人 flags_set 的列表（同现有 flag 校验格式）；`key:true` 每章超过 2 个、普通抉择单项 effects 超过 ±10 时报警（direction-v3 约定）。
- 保留现有全部检查和引擎自检，并为新求值器加自检：数组 requires、字符串 when、hide_if、键值 flag、in 列表、{all/any}、min/max 夹紧、无 eval（源码中不得出现 `Function(` 或 `eval(`）。
- 真结局三条路线用例：所需 flag 全部被数据设置时才启用，否则 SKIP 并列出缺的。

## 3. build.py
- 图片查找跳过 `art/out/_draft_genimage/`（及其子目录）。同时接受 .webp 与 .png（同 N 时优先 webp），仍取最高 vN；命名 `<bg>_vN`、`thumb_<选项id>_vN`、`ending_<id>_vN`。samples 后备保留。

## 验收
运行 `timeout 60 python3 build.py && timeout 120 node test_paths.js` 均成功（测试发现数据问题不算失败，引擎自检失败才非零退出）；`node -e "require('./engine.js')"` 正常；index.html 用 file:// 打开无报错。完成后简述改了什么。
