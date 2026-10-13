# 第三章结局门槛平衡（v1）

本文定稿第三章两个数值结局的门槛。结局按 [第三章结局草稿](../chapters/c3/endings_draft_v1.yaml) 的顺序逐条匹配，命中第一个结局后停止。

## 最终门槛

- **`C3_E_PULLBACK`「它在往回收」**：`echo:c3_tang==called && EVD>=45`。结局草稿里的现有 ID 是 `C3_E_PULL`。
- **`C3_E_TWO`「两个我」**：`echo:c3_prior==isolated && SLF>=40 && flag:c2_glove_guess_self`。

其余条件与文本仍以结局草稿为准；顺序为 `C3_E_BROKEN → C3_E_PULL → C3_E_TWO → C3_E_VOICE → C3_E_STOP`。

## 门槛依据

### 「它在往回收」：EVD ≥ 45

`puzzle/slf_dist_c1c2_v1.md` 中，c1+c2 结束时的 EVD 为 P25=11、P50=17、P75=24、P90=31，最大值为 37；`c2_glove_guess_self` 子集中最大值为 38。第三章拨号路线固定增加 25 EVD，因此最高约为 62–63，编剧占位值 65 无法达到。门槛 45 等价于入第三章前 EVD 至少 20，约能覆盖 40% 的拨号路线。

### 「两个我」：SLF ≥ 40

在 `c2_glove_guess_self` 子集中，c2 结束时 SLF 为 P25=5、P50=15、P75=25、P90=35，最大值为 43。第三章选择隔离记忆会增加 15 SLF；若在 `c3_s00a` 选择「为什么是我？」（`c3_s00a_why_me`），另增加 5 SLF。因此达到 40 需要 c2 结束时 SLF 约为 20–25 或更高，约覆盖满足「隔离 + 自我猜测」条件路线的 25–40%。若门槛设为 30，约 60% 会进入该结局，故定为 40。

## 第三章 EVD 增量

`c3_s00a`、`c3_s01a`、`c3_s02a` 三个普通场景各增加 5 EVD，合计 +15。拨号选择 `c3_s04a_call` 再加 10，拨号路线总计 **+25 EVD**；不拨号路线通过 `b_c3_not_called` 奖励加 3，总计 **+18 EVD**。因此每条第三章路线的 EVD 增量在 18–25 之间。

## 结局可达且可避开

下列说明均可先选一条 `c1_mira` 不为 `forced` 的路线，避免排在最前的残缺回放结局。

| 结局 | 可达方式 | 可避开方式 |
| --- | --- | --- |
| `C3_E_BROKEN`「残缺的回放」 | 让 `echo:c1_mira==forced`；它排在首位，不受数值门槛影响。 | 选择使 `c1_mira` 不为 `forced` 的路线。 |
| `C3_E_PULL`「它在往回收」 | 拨号，且入第三章 EVD≥20，使第三章结束时 EVD≥45。 | 不拨号，或拨号但入章 EVD<20。 |
| `C3_E_TWO`「两个我」 | 有 `c2_glove_guess_self`，入章 SLF≥20 时选择 `c3_s00a_why_me`（+5）和隔离（+15），并不拨号以避开前置的 PULL。 | 合并记忆、没有 `c2_glove_guess_self`，或隔离后 SLF<40。 |
| `C3_E_VOICE`「她的声音」 | 选择合并记忆，且不触发前面更早的结局；例如不拨号。 | 选择隔离记忆；如需落到 STOP，再使 TWO 条件不成立。 |
| `C3_E_STOP`「停在 04:39」 | 不触发 BROKEN；不拨号以避开 PULL；选择隔离，但令 TWO 的 flag 或 SLF 条件不成立。 | 触发任一更早结局，或选择合并记忆进入 VOICE。 |

## 数据与 ID 备注

- `puzzle/c3_effects_v1.yaml` 继续作为数值效果唯一设计稿，本次只定结局门槛，不改效果。
- `story/c3_draft_v1.yaml` 中 11 个选项 ID 与 `puzzle/c3_effects_v1.yaml` 中对应选项 ID 一一对应；`b_c3_not_called` 是额外的一次性平衡奖励。
- `puzzle/slf_dist_c1c2_v1.md` 的 **P10 列有百分位计算错误**，本次忽略，不用于门槛判断；后续在 v2 脚本中修正。
