import { Game } from "./controllers/game.js?v=4";
import { $, node, button } from "./ui/dom.js";
try {
  const [story, art] = await Promise.all(
    ["src/story.json?v=4", "assets/manifest.json?v=4"].map(async (path) => {
      const response = await fetch(path);
      if (!response.ok) throw Error("无法加载 " + path);
      return response.json();
    }),
  );
  const game = new Game(story, art);
  window.addEventListener(
    "pagehide",
    (event) => {
      if (!event.persisted) game.destroy();
    },
    { once: true },
  );
  // Diagnostics are opt-in, kept out of normal play.
  if (new URLSearchParams(location.search).get("debug") === "1")
    window.__GAME__ = { game, story, art };
} catch (error) {
  $("#loading").replaceChildren(
    node("div", "连接暂时中断", "loading-mark"),
    node("p", error.message),
    button("重新连接", () => location.reload(), "primary"),
  );
}
