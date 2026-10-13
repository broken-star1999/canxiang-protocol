# 第一章数值平衡 v3（章节制，谜题设计，2026-10-13）
依据 proposal-v5 §A、decisions-N1-N5.md。v1、v2 保留不动。适用稿件：s00-s01 v4、s02 v2、s03 v4、s04 v2。

## 1. 幅度上限（与前端核对，测试按此报警）
| 类型 | EVD | TRU / EXP / SLF |
|---|---|---|
| 普通抉择 key:false | ±8 | ±10 |
| 关键抉择 key:true | ±10 | ±20 |
| bonuses | ±5 | ±5 |
每章 EVD 预算：认真玩的一条路线约 18–25，理论上限 ≤ 30。全篇 EVD 累计约 100，终章真结局门槛 70 不变，需要玩家在多数章节都认真取证。

## 2. 第一章逐项调整（time 不变）
| 选项 | 原 | v3 |
|---|---|---|
| s01a_force 强行提权 | EXP+25 TRU−10 | EXP+10 TRU−10 |
| s01b_chat 看聊天 | EVD+5 | EVD+2 |
| s02a_plc | EVD+10 | EVD+3 |
| s02a_bus（bus_log） | EVD+20 | EVD+6 |
| s02b_go 去配电间 | EVD+20 EXP+20 | EVD+6 EXP+10 |
| s02c_photo | EVD+10 | EVD+3 |
| s02c_remove | EVD−15 SLF+5 TRU+5 | EVD−5 SLF+5 TRU+5 |
| s02c_cover | EVD+5 EXP−15 TRU−10 | EVD+2 EXP−10 TRU−10 |
| s03a_repair | TRU+25 | TRU+10 |
| s03a_pain | TRU+15 SLF+5 | TRU+8 SLF+5 |
| s03a_force（key） | EVD+25 TRU−30 | EVD+10 TRU−20 |
| s03b_give | EVD+25 TRU+5 | EVD+8 TRU+5 |
| s03b_keep | TRU+15 | TRU+10 |
| s04a_mail（key） | EVD+5 EXP+15 | EVD+5 EXP+10 |
其余选项不变（都已在上限内）。

## 3. 核对
- s03b 的 TRU≥50 门槛仍可达：回应屏幕+10、维护登录+10、整理记忆+10 → 60；问疼路线 30+10+10+8 = 58。只走一项（30+10）到不了 50，这是有意的取舍。
- 第一章 EVD：日志派 2+3+6+8+5 = 24；现场派 3+6+3+8 = 20；强制导出派 6+6+3+10+5 = 30（上限，代价是 TRU−20 和 mira_forced）。
- 第一章 EXP 最高 30（提权10+配电间10+寄邮箱10），按 N4 每章减 20 带入第二章。
- 真结局"至少 3 条路线"改到终章统一验证，第一章只要求 3 种取证风格都能拿到 18 以上。
- c1_endings_v1.yaml 里的 7 个结局已升为终章，第一章小结局以 chapters/c1/endings_draft_v1.yaml 为准；终章判定我之后另出新版。
