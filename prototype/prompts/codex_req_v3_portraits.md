# 需求 v3（在 v2 基础上增量；只改 prototype/ 内文件，不 git，不联网）
1. build.py 立绘查找：场景 `portrait: <名>` 时，在 art/out/（跳过 _draft_genimage/）查 `portrait_<名>_vN.webp`（也接受 .png，同 N 优先 webp），取最高 N；仍兼容 `<名>_vN` 与 samples 后备（mira_lv1 → ../samples/portrait_mira_lv1_v1.png）。所有 portrait_overrides 的 `to` 立绘也要进图片清单。
2. 章节顶层 `portrait_overrides: [{when, from, to}]`（build.py 按 bonuses 同样方式从 story/ 与 puzzle/ 合并）。engine 新增 `E.resolvePortrait(D, scene, st)`：按顺序检查，第一条 when 为真且 from == 场景 portrait 时返回 to，否则原值。when 用现有求值器。app.js 渲染立绘只用它。例：`{when: "flag:forced_export", from: mira_lv1, to: mira_broken}`。
3. test_paths.js：缺图检查覆盖所有可达状态下实际显示的立绘（含被替换后的 to）；报告 portrait_overrides 引用但无人设置的 flag；引擎自检加 resolvePortrait 用例（命中/未命中/from 不匹配）。
验收：`timeout 60 python3 build.py && timeout 120 node test_paths.js` 成功，`node -e "require('./engine.js')"` 正常。简述改动。

## 补充（编剧确认 flag 名 mira_forced）
4. 新增 prototype/overrides.yaml，内容：
   portrait_overrides:
     - { when: "flag:mira_forced", from: mira_lv1, to: mira_broken }
   build.py 合并规则：story/ 与 puzzle/ 里有 portrait_overrides 时优先（排在前面）；overrides.yaml 的条目追加在后，且若 story 已有相同 from+to 则不重复加入。报告里注明来源。
5. story/ 下按段取最高版本时需正确处理 c1_s03_draft_v3.yaml 等新段（段名排序按 c1_s00-s01、c1_s02、c1_s03 自然序），场景顺序 = 段顺序，第一个段的第一个场景为起点。
