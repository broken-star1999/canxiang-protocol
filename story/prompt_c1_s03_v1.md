你是视觉小说《残响协议》的编剧。请写第一章「三 · MIRA 的残响」的剧情 YAML，输出到 story/c1_s03_draft_v1.yaml（新文件，不要改任何已有文件）。

必读参考：proposal-v2.md 的 §2（世界观、角色、时间线、身份误导 L1–L4）、§3、§4「三 · MIRA 的残响」；puzzle/c1-balance-draft-v2.md；格式和文风严格对齐 story/c1_s02_draft_v1.yaml 和 story/c1_s00-s01_draft_v4.yaml。

格式要求：字段 id/bg/portrait/text/choices；选项字段 id,label,key,thumb,effects,time,flags_set,result,log,next，可用 hide_if/requires（flag 列表）；数值只用 EVD/TRU/EXP/SLF。log 不写时间。场景头不写时间。没有倒计时。
内容：
- 场景 c1_s03a（bg: scene_bay7_emergency, portrait 按 MIRA 状态，如 mira_lv1）：MIRA 被降级后说话断续。三个选项：
  1. 花时间帮她整理碎片记忆：TRU+25，time 12，key:false。她第一次说出完整的话："他让我删掉。我留了一份。在我自己里面。"
  2. 问她"你疼吗？"：TRU+15，SLF+5，time 3，key:false，flags_set [asked_pain]。长久静默后："……没有人问过。"
  3. 直接强制导出她的缓存：EVD+25，TRU-30，time 2，key:true，flags_set [mira_copy, mira_forced]，next 直接去 c1_s04a。她的声纹碎了一角，再也不叫你"操作员"。
  选项1、2 的 next 都是 c1_s03b。
- 场景 c1_s03b：给选项加字段 `when: "TRU >= 50"` 表示数值条件（新字段，在文件头注释说明）。
  - "把副本给我吗？"（when TRU>=50）：她自愿交出，EVD+25，TRU+5，time 2，flags_set [mira_copy]，key:false
  - "你自己留着，那是你的"（when TRU>=50）：TRU+15，time 1，flags_set [mira_kept]，key:false（复盘时她会提到）
  - 另加一个始终可选的兜底选项（TRU<50 时玩家唯一能选的）：如"先不问了，走吧"，effects {}，time 0，时可写成 MIRA 欲言又止。
  全部 next: c1_s04a。
文风：林述式第一人称（"你"），冷、静、克制，有人性；绝不写呼吸、心跳、饥饿；不写标准编号；技术细节服务剧情，不要写"切母线就是 STO"或"软件绝不能旁路急停"。MIRA 不是工具，要让玩家对她的选择有分量。每个 result 2–4 小段，log 一句。
写完用 python 检查 YAML 语法（若无 pyyaml 就 pip install --user pyyaml）。
