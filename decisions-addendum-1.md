# 补充决定 1（2026-10-13 23:22）
- M1 第一章剧本：星笺审核通过（story/c1_s04_draft_v1.yaml、chapters/c1/endings_draft_v1.yaml）。
- 按条件切换文本：新增通用字段 `text_variants: [{when, text}]`，when 语法同结局条件（flag/数值/回响）；按顺序取第一条满足的，都不满足用 `text`。`text_by_echo` 保留为简写。不拆场景，不加 text_by_flag。
- 5 个小结局卡图：同一应急灯底图做小差异（特写道具/光向/冷暖），不新画大图。
