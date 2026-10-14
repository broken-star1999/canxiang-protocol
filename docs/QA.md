# 发布前验证 · V3.1

2026-10-14完成。

- 静态剧情/资源校验：五章、95场景、720段台词、六个核心结局具有合法出口；图像引用全部存在。
- Node测试十一项通过，遍历超过9.7万个不同因果状态（将影响未来条件完全相同的状态合并检查）；所有节点、选项、六个结局均可达，无循环或死路。这个数量是状态数，不是不同结局或完整剧情路线数。
- 验证关系数值、条件台词、回响、章节输入状态及存档回读。
- 验证无效/恶意存档在替换之前被拒绝，旧存档键不被覆盖，浏览器存储失败时仍能游玩和导出。
- Chromium实际运行：六个核心结局与四种失败过程、手动保存、页面刷新后继续、条件不满足的终章选项锁定，键盘不能绕过锁定。
- 从剧情树直接修改第一章选择，确认恢复原节点状态，没有混入终章证据/记忆标记；旧节点重新读取正确，六个结局全局收集独立保留。
- 验证章节剧情图为有向无环图，所有节点布局完整，当前路径连线、未知节点遮蔽、缩放与节点定位可用。
- 桌面1440×900、手机390×844画面检查；修复手机溢出，检查实际显示的背景与立绘解码。
- 12张立绘全部检查透明通道；背景与立绘图集人工视觉检查后才接入。
- JavaScript语法与Git空白检查通过。

本地检查命令：`npm run check`、`npm test`。当前浏览器验证脚本为 `tools/browser_branches.py`，使用Python Playwright和系统Chromium；V3.0脚本移至归档目录。浏览器验证环境与游戏运行依赖无关。调试接口仅在URL附加 `?debug=1` 时启用。

当前浏览器验证基于Chromium，尚未逐台实机测试Safari及各手机厂商浏览器。所有音频从首次用户交互后启动，不支持全屏的设备会保留普通浏览器模式。游戏为静态部署，进度在浏览器本地保存，无服务端同步。

## V3.2 — UI and motion polish (2026-10-14)

- Title lettering, portrait and menu enter in layers; waveform and sparse ambient motes reinforce the station setting.
- Mouse-only star trail uses a fixed pool of 24 elements, no continuous animation loop. Touch and reduced-motion users receive no trail.
- Cached, decoded portrait swaps use guarded crossfades; choice acknowledgement is cosmetic and never delays story state. Evidence and echo cards open the archive.
- Panels, chapter headings, endings, flow selections and saves receive restrained feedback. Keyboard and disabled-choice protections remain intact.
- `npm run check` and all 11 tests pass (97,333 causal states).
- `python tools/browser_branches.py`: six endings, four failure variants, save reload, rewind and mobile flow pass without browser errors.
- `python tools/browser_polish.py`: desktop/mobile screenshots, bounded star pool, choice acknowledgement and live OS reduced-motion switching pass without browser errors.
- Save schema and browser storage key remain unchanged from V3.1.

### V3.2.1 visibility correction

Star trails now render at 10–18px with a full-size peak, brighter warm highlights and 0.95–1.15s fade. Hybrid devices with an attached mouse use any-pointer detection. The title waveform has its own layout row, 35 thicker bars and staggered motion. Desktop copy spacing keeps text clear of menu controls. Reduced-motion and touch behavior remain intact.

### V3.2.3 — softer mouse trail

Replace hard star stamps with overlapping radial glows and occasional softly lit stars. Interpolate up to six points per mouse segment to cover fast curves, with small velocity-based drift and a gradual 650–900ms fade. A fixed 48-element pool bounds work; no continuous animation loop runs while idle. Browser checks cover actual mouse movement, star accents, complete fade after stopping, live reduced-motion switching, mobile layout and unaffected choice/portrait interactions.
