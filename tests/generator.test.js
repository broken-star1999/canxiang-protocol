import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
const root = path.resolve(import.meta.dirname, "..");
const python =
  process.env.CANXIANG_PYTHON ||
  (process.platform === "win32" ? "python" : "python3");

function cleanup(temp) {
  const resolved = path.resolve(temp);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.match(path.basename(resolved), /^canxiang-(generator|atomic)-/);
  fs.rmSync(resolved, { recursive: true });
}

test("Chapter generator is deterministic UTF-8 in Windows locale and UTF-8 mode", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "canxiang-generator-"));
  try {
    const a = path.join(temp, "default.json"),
      b = path.join(temp, "utf8.json");
    execFileSync(
      python,
      [path.join(root, "tools/build_story.py"), "--output", a],
      { env: { ...process.env, PYTHONUTF8: "0", PYTHONIOENCODING: "gbk" } },
    );
    execFileSync(
      python,
      [path.join(root, "tools/build_story.py"), "--output", b],
      { env: { ...process.env, PYTHONUTF8: "1" } },
    );
    const bytes = fs.readFileSync(a);
    assert.deepEqual(bytes, fs.readFileSync(b));
    assert.deepEqual(bytes, fs.readFileSync(path.join(root, "src/story.json")));
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally {
    cleanup(temp);
  }
});

test("Invalid authored content leaves the last generated file intact", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "canxiang-atomic-"));
  try {
    fs.mkdirSync(path.join(temp, "tools"));
    fs.mkdirSync(path.join(temp, "assets"));
    fs.mkdirSync(path.join(temp, "src"));
    fs.copyFileSync(
      path.join(root, "tools/build_story.py"),
      path.join(temp, "tools/build_story.py"),
    );
    fs.copyFileSync(
      path.join(root, "assets/manifest.json"),
      path.join(temp, "assets/manifest.json"),
    );
    fs.cpSync(path.join(root, "story"), path.join(temp, "story"), {
      recursive: true,
    });
    const output = path.join(temp, "src/story.json");
    fs.writeFileSync(output, "previous valid generation");
    const chapter = path.join(temp, "story/chapters/c1.json"),
      data = JSON.parse(fs.readFileSync(chapter, "utf8"));
    data.scenes.c1_01.next = "missing-scene";
    fs.writeFileSync(chapter, JSON.stringify(data));
    const result = spawnSync(python, [path.join(temp, "tools/build_story.py")]);
    assert.notEqual(result.status, 0);
    assert.equal(fs.readFileSync(output, "utf8"), "previous valid generation");
    assert.deepEqual(fs.readdirSync(path.dirname(output)), ["story.json"]);
  } finally {
    cleanup(temp);
  }
});
