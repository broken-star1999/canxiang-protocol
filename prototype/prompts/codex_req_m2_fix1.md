# M2 修正 1（增量；规则同 M2：只改 prototype/ 内文件，不 git）
1. c1 结局文件取 chapters/c1/endings_draft_vN.yaml 的最高版本（当前 v2），index.yaml 里的 endings_file 视为基名，build 自动取最高 vN。
2. 结局图查找顺序：先用结局的 `image` 字段（如 ending_C1_E_CRACK 或 bg/xxx：去掉目录前缀后按 <名>_vN 在 art/out/ 找最高版本），找不到再按 ending_<id>_vN 约定，最后占位。测试报告列出 image 字段指向但找不到的图。
3. 重跑 build 与测试，确认 5 个小结局的图都已解析。
