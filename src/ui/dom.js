export const $ = (selector) => document.querySelector(selector);
export const node = (tag, text, cls) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (cls) element.className = cls;
  return element;
};
export const button = (text, action, cls) => {
  const element = node("button", text, cls);
  element.type = "button";
  element.addEventListener("click", action);
  return element;
};
export const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
export const musicMood = (bg) =>
  bg === "bridge-night"
    ? "cold"
    : ["tea", "office", "home", "medical"].includes(bg?.split("-")[0])
      ? "warm"
      : ["sea", "control", "bridge", "dock"].includes(bg?.split("-")[0])
        ? "dawn"
        : "cold";
export const characterIds = {
  MIRA: "mira",
  周衡: "zhou",
  唐棠: "tang",
  林述: "lin",
};
export const dateText = (time) =>
  new Date(time).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
