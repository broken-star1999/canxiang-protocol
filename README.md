# 残响协议

五章完整科幻互动视觉小说。在2041年的雾岬站，你从陌生的维护载体中醒来，带着工程师林述的记忆，调查一场急停事故，并决定如何留下真相与自己的回答。

**[在线游玩](https://broken-star1999.github.io/canxiang-protocol/)** · [旧版与原有存档](https://broken-star1999.github.io/canxiang-protocol/legacy/)

## 游玩

五章：急停、二十三个人、先验、预检、残响。95个场景节点、720段对话与叙述、六个核心结局。16,071字正文，阅读速度和选择不同会影响时长。

- 全屏动漫场景、四名主要角色的三种表情、逐句阅读与转场。
- 选择改变关系、后续台词、证据与回响；章节与结局逐步解锁；不同的前期选择会锁定或改变后期行动。
- 自动存档、六个手动槽、存档文件导入导出、章节重玩。
- 可缩放与平移的剧情树、节点缩略图、当前路线连线、探索度、节点回溯与直接改选。
- 回看、自动阅读、仅已读快进、字号与速度设置、减少动画、可选紧急限时。
- 电脑与手机浏览器均可游玩。没有配音，音乐和提示音为原创程序合成。

点击或空格继续，1–3选择，Esc菜单，H隐藏，A自动，L回看。首次点击后启用音频，设置中可关闭。剧情涉及事故、伤害与身份焦虑，画面无重口血腥。人物和事件均为虚构。

## 本地运行

静态项目，无安装或构建依赖。不要直接双击HTML，使用本地HTTP服务：

```sh
python3 -m http.server 8080
```

打开 `http://localhost:8080/`。Node 24+可运行检查：

```sh
npm run check
npm test
```

剧情编写源在 `tools/build_story.py`，修改后执行 `python3 tools/build_story.py` 生成 `src/story.json`。美术原始图集保存在 `art/v3-source/`；Pillow用于图集拆分与WebP压缩：

```sh
python3 tools/pack_art.py art/v3-source/backgrounds-a.png art/v3-source/backgrounds-b.png art/v3-source/mira.png art/v3-source/zhou.png art/v3-source/tang.png art/v3-source/lin.png
```

`src/engine.js`负责规则，`src/storage.js`负责存档，`src/app.js`负责演出与界面，`src/audio.js`负责原创音频。新美术资源由AI生成，并进行风格重做、视觉检查、图集拆分和压缩；游戏不使用外部CDN或运行库。参考《罪心理》的场景分层与视觉统一手法，没有复制其源码或资源。剧情树与回溯体验另参考《情感反诈模拟器》的公开故事线截图及社区指南，相关研究记录见 [docs/REFERENCE.md](docs/REFERENCE.md)。

## 存档与发布

分支重写版使用 `canxiang:vn:v2`；V3.0 使用 `canxiang:vn:v1` 并保留在 [上一版入口](https://broken-star1999.github.io/canxiang-protocol/v3-archive/)，旧版的 `echo-protocol:v3:archive` 和 `cx_save` 不被读取或覆盖。旧剧情逻辑无法直接迁移为重写后的剧情状态，请通过旧版入口继续原存档。进度在浏览器本地保存；清理浏览器数据前请导出备份。

GitHub Pages使用 `main` 分支根目录，`.nojekyll` 保留。推送后无需额外构建。发布前验证记录见 [docs/QA.md](docs/QA.md)，故事与制作方向见 [docs/DIRECTION.md](docs/DIRECTION.md)。
