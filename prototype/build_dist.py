#!/usr/bin/env python3
"""Export a self-contained static site to prototype/dist/ (GitHub Pages).
Does not modify build.py / app.js / any source; patches are applied to dist copies only."""
import json, os, re, shutil, subprocess, sys, glob
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = os.path.join(ROOT, "art", "out")
DIST = os.path.join(HERE, "dist")
LEAKS = ["thumb_c1_s02b_stay_v1", "thumb_c1_s02a_done_v1", "thumb_c1_s04a_mira_v1"]

subprocess.run([sys.executable, "build.py"], cwd=HERE, check=True)
if os.path.isdir(DIST):
    shutil.rmtree(DIST)  # only dist itself (generated output)
os.makedirs(os.path.join(DIST, "art", "icons"))

def patch(text, old, new, name):
    if old not in text:
        sys.exit(f"patch anchor missing in {name}: {old[:40]!r}")
    return text.replace(old, new, 1)

for f in ["index.html", "style.css", "engine.js", "app.js"]:
    shutil.copy2(os.path.join(HERE, f), os.path.join(DIST, f))
# dist-only fixes: dedupe review curve rows, highlight newest log entry
app = open(os.path.join(DIST, "app.js"), encoding="utf-8").read()
app = patch(app, "    for (const row of curve) {\n      const tr = node(\"tr\");",
  "    let prevSig = null;\n    for (const row of curve) {\n      const sig = [\"t\", \"EVD\", \"TRU\", \"EXP\", \"SLF\"].map(k => row[k]).join(\"|\");\n      if (sig === prevSig) continue;\n      prevSig = sig;\n      const tr = node(\"tr\");", "app.js")
app = patch(app, "      $(\"#logList\").appendChild(li);\n    }",
  "      $(\"#logList\").appendChild(li);\n    }\n    { const last = $(\"#logList\").lastElementChild; if (last) { last.classList.add(\"log-latest\"); last.scrollIntoView && last.scrollIntoView({ block: \"nearest\" }); } }", "app.js")
open(os.path.join(DIST, "app.js"), "w", encoding="utf-8").write(app)
with open(os.path.join(DIST, "style.css"), "a", encoding="utf-8") as fh:
    fh.write("\n/* dist: newest log entry */\n#logList li.log-latest { border-left: 3px solid var(--mint); padding-left: .4em; background: rgba(120,255,200,.08); }\n")

data = json.load(open(os.path.join(HERE, "data.json"), encoding="utf-8"))
data.pop("asset_inventory", None)
imgs = data.get("images", {})
for k in [k for k, v in imgs.items() if isinstance(v, str) and "samples/" in v]:
    del imgs[k]
refs = set()
def walk(o):
    if isinstance(o, dict): return {k: walk(v) for k, v in o.items()}
    if isinstance(o, list): return [walk(v) for v in o]
    if isinstance(o, str) and o.startswith("../art/out/"):
        rest = o[len("../art/out/"):]; refs.add(rest); return "art/" + rest
    return o
data = walk(data)
for rest in sorted(refs):
    src = os.path.join(ART, rest)
    if not os.path.isfile(src): sys.exit("missing source " + src)
    if not re.search(r"\.(webp|svg)$", rest): sys.exit("non-webp/svg referenced: " + rest)
    dst = os.path.join(DIST, "art", rest); os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
for svg in glob.glob(os.path.join(ART, "icons", "*.svg")):
    shutil.copy2(svg, os.path.join(DIST, "art", "icons"))
js = json.dumps(data, ensure_ascii=False, indent=1)
open(os.path.join(DIST, "data.json"), "w", encoding="utf-8").write(js)
open(os.path.join(DIST, "data.js"), "w", encoding="utf-8").write("window.STORY=" + js + ";\n")

# assertions
for f in ["data.js", "data.json", "app.js", "index.html", "style.css", "engine.js"]:
    t = open(os.path.join(DIST, f), encoding="utf-8").read()
    if "../" in t: sys.exit(f"'../' found in dist/{f}")
    if f.startswith("data") and "samples" in t: sys.exit("samples ref in dist data")
files = [os.path.join(dp, n) for dp, _, ns in os.walk(DIST) for n in ns]
for p in files:
    b = os.path.basename(p)
    if any(b.startswith(l) for l in LEAKS) or b.startswith(("contact_", "gen")) or b.endswith((".png", ".yaml", ".py", ".md")):
        sys.exit("forbidden file in dist: " + p)
print(f"dist OK: {len(files)} files, {sum(os.path.getsize(p) for p in files)} bytes, {len(refs)} referenced assets")
