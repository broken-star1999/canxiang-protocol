import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = path.resolve(import.meta.dirname, "..");
const python =
  process.env.CANXIANG_PYTHON ||
  (process.platform === "win32" ? "python" : "python3");
execFileSync(python, [path.join(root, "tools/build_story.py"), "--check"], {
  stdio: "inherit",
});
execFileSync(process.execPath, [path.join(root, "tools/validate.mjs")], {
  stdio: "inherit",
});
const files = fs
  .readdirSync(path.join(root, "src"), { recursive: true })
  .filter((p) => p.endsWith(".js"));
for (const file of files) {
  const absolute = path.join(root, "src", file);
  execFileSync(process.execPath, ["--check", absolute]);
  const content = fs.readFileSync(absolute, "utf8");
  for (const match of content.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    if (
      !fs.existsSync(
        path.resolve(path.dirname(absolute), match[1].split("?")[0]),
      )
    )
      throw Error("Missing module " + match[1] + " in " + file);
  }
}
for (const file of [
  "style.css",
  ...fs.readdirSync(path.join(root, "styles")).map((p) => "styles/" + p),
]) {
  for (const match of fs
    .readFileSync(path.join(root, file), "utf8")
    .matchAll(/@import\s+url\(["']?([^"')]+)["']?\)/g)) {
    if (
      !fs.existsSync(
        path.resolve(root, path.dirname(file), match[1].split("?")[0]),
      )
    )
      throw Error("Missing stylesheet " + match[1]);
  }
}
console.log(
  `Checked ${files.length} JavaScript modules, stylesheet imports and generated data.`,
);
