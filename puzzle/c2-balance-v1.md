# 第二章数值平衡 v1

依据 `story/c2_outline_v1.md`、`puzzle/c1-balance-v3.md` 与 `puzzle/c1_effects_v1.yaml`。数值沿用第一章幅度上限：普通选项 EVD ±8、其他数值 ±10；关键选项 EVD ±10、其他数值 ±20；联动奖励各项 ±5。每章认真调查路线目标约 18–25 EVD，硬上限 30。

## 1. 建议脚本采用的选项 ID

大纲未给选项 ID，以下是本章建议使用的完整 ID；`puzzle/c2_effects_v1.yaml` 按 ID 排序记录数值。

| 场景 | 建议选项 ID | 类型 |
|---|---|---|
| `c2_s00a` | `c2_s00a_answer`、`c2_s00a_log`、`c2_s00a_ring` | 普通 |
| `c2_s01a` | `c2_s01a_ask`、`c2_s01a_glove`、`c2_s01a_none` | 普通 |
| `c2_s02a` | `c2_s02a_confront`、`c2_s02a_play`、`c2_s02a_silent` | 关键 K2-A |
| `c2_s03a` | `c2_s03a_hang`、`c2_s03a_letter`、`c2_s03a_send` | 普通；`send` 需 `zhou_heard` |
| `c2_s04a` | `c2_s04a_copied`、`c2_s04a_kept`、`c2_s04a_unread` | 关键 K2-B |
| `c2_s05a` | `c2_s05a_dunno`、`c2_s05a_lin`、`c2_s05a_none` | 普通 |

脚本约定：K2-A 三项分别写 `echo_set: { c2_stance: play|confront|silent }`；K2-B 三项分别写 `echo_set: { c2_letter: copied|kept_secret|unread }`。`c2_s02a_play` 设置 `trace_he_zheng`，`c2_s03a_letter` 设置 `zhou_letter`。在 `c2_s03a` 前判定并设置 `zhou_heard`：`echo:c2_stance in [play,silent] && (TRU >= 55 || SLF >= 30)`；`c2_s03a_send` 仅在该 flag 已设置时出现。

为让联动奖励能按现有条件语法执行，请脚本在 `c2_s01a_glove` 设置内部 flag `c2_took_glove`，在 `c2_s01a_ask` 设置 `c2_asked_mira`；这两个 flag 不必导出到后续章节。`c2_s05a_dunno` 设置 `c2_answered_dunno`，供小结局条件引用。

## 2. 唯一数值调整

未加联动奖励时，`silent + c2_s03a_letter + c2_s04a_copied` 只有 EVD+16（`3 + 3 + 10`），低于认真调查路线的 18 下限。最小调整是在关键选项 `c2_s02a_silent` 增加 EVD+2，最终为 EVD+2、SLF+10、EXP−5；EVD+2 在关键选项 ±10 上限内。其他给定数值不变。调整后该路线基础 EVD 为 18，触发 `b_zhou_both` 时为 23。

## 3. 入章样本与主路线表

以下两组入章状态均由第一章现有数值可达。EXP 已按每章开头 −20（下限 0）结转。

| 入章样本 | 第一章路线（按场景顺序） | 入章 EVD / TRU / EXP / SLF | 相关回响与 flag |
|---|---|---:|---|
| 信任路线 | `c1_s00a_look, c1_s00b_move, c1_s01a_mira, c1_s01b_estop, c1_s02a_plc, c1_s02b_go, c1_s02c_photo, c1_s03a_repair, c1_s03b_give, c1_s04a_mira` | **20 / 60 / 0 / 10**（EXP 原为 20，扣 20 后为 0） | `c1_mira=mended`、`c1_cache=mira`、无 `ignored_arm` |
| 低信任路线 | `c1_s00a_look, c1_s00b_ignore, c1_s01a_force, c1_s01b_chat, c1_s02a_env, c1_s02b_go, c1_s02c_remove, c1_s03a_force, c1_s03b_leave, c1_s04a_mail` | **18 / 5 / 10 / 10**（EXP 原为 30，扣 20 后为 10） | `c1_mira=forced`、`c1_cache=mail`、有 `ignored_arm` |

主路线表采用同一组第二章选择：`c2_s00a_log`、`c2_s01a_glove`、对应 K2-A 选项、`c2_s03a_letter`、`c2_s04a_copied`、`c2_s05a_none`。表中是结算所有适用奖励后的离章值；EVD 括号内为本章增量。信任样本触发 `b_cache_mira`（EXP−5）；低信任样本触发 `b_arm_glove`（SLF+5）。`b_zhou_both` 只在表中 `zhou_heard=是` 时触发。

| 入章样本 / K2-A | 离章 EVD（本章增量） | 离章 TRU | 离章 EXP | 离章 SLF | `zhou_heard` |
|---|---:|---:|---:|---:|---|
| 信任 / play | **49（+29）** | 60 | 10 | 18 | 是（TRU 60） |
| 信任 / confront | **41（+21）** | 60 | 25 | 18 | 否（stance 不符合） |
| 信任 / silent | **43（+23）** | 60 | 0 | 28 | 是（TRU 60） |
| 低信任 / play | **42（+24）** | 5 | 25 | 23 | 否（TRU 5、SLF 23） |
| 低信任 / confront | **39（+21）** | 5 | 40 | 23 | 否（stance 不符合） |
| 低信任 / silent | **41（+23）** | 5 | 15 | 33 | 是（SLF 33） |

因此调查路线 EVD 增量为 **18–29**，最高 29，均在 18–30 范围内。逐项上限也通过：普通选项最高 EVD+3、其他数值+8；关键选项最高 EVD+10、其他数值+20；全部奖励为 ±5。silent 的调整后 EVD+2 仍远低于关键选项上限。若 silent 路线未触发 `b_zhou_both`，其调查组合的 EVD 是 **18**，仍达下限。

## 4. 周衡门槛与五个小结局可达性

`zhou_heard` 可达且可避：信任样本选择 play 或 silent 时由 TRU≥55 达标；低信任样本选择 silent 时，`SLF 10 + glove 8 + b_arm_glove 5 + silent 10 = 33`，由 SLF≥30 达标。低信任样本选择 play 且同样拿手套时，判定值为 TRU 5、SLF 23，不设置 `zhou_heard`；confront 也因 stance 不在 `[play,silent]` 中而避开门槛。

按大纲顺序先匹配第一个结局：

| 小结局 | 条件 | 可达路线例 | 避开方式 |
|---|---|---|---|
| `C2_E_WHO` | `SLF >= 35 && flag:c2_answered_dunno` | 低信任样本：`c2_s00a_ring → c2_s01a_glove → c2_s02a_silent → c2_s03a_send → c2_s04a_kept → c2_s05a_dunno`；判定时 SLF=53，回答后为 58 | 同一路线在末场选 `c2_s05a_lin` 或 `c2_s05a_none`，没有 `c2_answered_dunno` |
| `C2_E_CHAIR` | `echo:c2_stance==confront` | 低信任样本：`c2_s00a_answer → c2_s01a_none → c2_s02a_confront → c2_s03a_hang → c2_s04a_unread → c2_s05a_none` | 选择 play 或 silent |
| `C2_E_HEARD` | `flag:zhou_heard` | 信任样本：`c2_s00a_answer → c2_s01a_none → c2_s02a_play → c2_s03a_hang → c2_s04a_unread → c2_s05a_none`；TRU=60 使 flag 成立，WHO 与 CHAIR 不成立 | 低信任样本选择 `c2_s01a_none → c2_s02a_play`，TRU=5、SLF=5，flag 不成立；也可选择 confront |
| `C2_E_DRAFT` | `echo:c2_letter==kept_secret` | 低信任样本：`c2_s00a_answer → c2_s01a_none → c2_s02a_play → c2_s03a_hang → c2_s04a_kept → c2_s05a_lin`；判定时 TRU=5、SLF=5，未设置 `zhou_heard`，WHO 与 CHAIR 不成立 | 在 K2-B 选 copied，落入 TAKE |
| `C2_E_TAKE` | 兜底 | 低信任样本：`c2_s00a_answer → c2_s01a_none → c2_s02a_play → c2_s03a_hang → c2_s04a_unread → c2_s05a_lin`；未满足前四项 | 选 kept_secret 可落入 DRAFT；选 confront 可落入 CHAIR |

由此 `zhou_heard` 和五个小结局均可达，也各有能避开的选择。`C2_E_WHO` 的 SLF 门槛按末场回答结算后的数值检查；本例在回答前 SLF=53，选择 dunno 后为 58。

## 5. 奖励条件

| 奖励 ID | 条件 | 效果 | 次数 |
|---|---|---|---|
| `b_arm_glove` | `flag:ignored_arm && flag:c2_took_glove` | SLF+5 | 一次 |
| `b_cache_mira` | `echo:c1_cache==mira && echo:c2_letter==copied` | EXP−5 | 一次 |
| `b_mira_tang` | `echo:c1_mira in [mended,asked] && flag:c2_asked_mira` | SLF+5 | 一次 |
| `b_zhou_both` | `flag:zhou_heard && echo:c2_letter==copied` | EVD+5 | 一次 |

每项奖励均在 ±5 上限内；`c2_s03a_letter` 设置的 `zhou_letter` flag 与 K2-B 的 `c2_letter` 回响是两个不同字段。
