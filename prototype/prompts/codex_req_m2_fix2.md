# M2 修正 2（增量；只改 prototype/ 内文件，不 git）
art/out/icons/ 实际是档案页的通用 UI 图标：icon_echo、icon_ending、icon_log、icon_review、icon_savecode（_vN.svg，取最高 N）。
1. 档案页五个分区标题（结局收集/行动日志/回响/复盘/存档码）分别用 icon_ending / icon_log / icon_echo / icon_review / icon_savecode 显示（约 20px，内联 img），缺失时不显示图标。
2. 章节卡和回响表里的回响小图标：先找 echoes.yaml 的 icon 专属图（icons/<icon>_vN.svg 或 art/out/<icon>_vN.*），没有则回退用 icon_echo，再没有才用色点。
3. 测试报告：把“被引用但缺失的回响专属图标”改为提示级（注明已回退 icon_echo），“icons 未被引用”应为无。
4. 支持 URL 参数 `?screen=chapters|game|archive` 直接显示对应页面（游戏页进入 c1 开头，开发用），便于无头截图。
验收：build、test_paths、node --check app.js 通过。
