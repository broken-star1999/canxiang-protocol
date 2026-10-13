#!/usr/bin/env python3
"""v2 mainline: app_v2.js/style_v2.css/build_v2.py -> dist as app.js/style.css. Export a self-contained static site to prototype/dist/ (GitHub Pages).
Does not modify build.py / app.js / any source; patches are applied to dist copies only."""
import json, os, re, shutil, subprocess, sys, glob
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = os.path.join(ROOT, "art", "out")
DIST = os.path.join(HERE, "dist")
LEAKS = ["thumb_c1_s02b_stay_v1", "thumb_c1_s02a_done_v1", "thumb_c1_s04a_mira_v1"]

if os.path.isdir(DIST) and not os.path.isdir(os.path.join(HERE,"dist_r1")):
    shutil.copytree(DIST, os.path.join(HERE,"dist_r1"))
subprocess.run([sys.executable, "build_v2.py"], cwd=HERE, check=True)
if os.path.isdir(DIST):
    shutil.rmtree(DIST)  # only dist itself (generated output)
os.makedirs(os.path.join(DIST, "art", "icons"))

def patch(text, old, new, name):
    if old not in text:
        sys.exit(f"patch anchor missing in {name}: {old[:40]!r}")
    return text.replace(old, new, 1)

for src, dst in [("index.html","index.html"),("style_v2.css","style.css"),("engine.js","engine.js"),("app_v2.js","app.js")]:
    shutil.copy2(os.path.join(HERE, src), os.path.join(DIST, dst))

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
d2=json.load(open(os.path.join(DIST,"data.json"),encoding="utf-8"))
if not d2.get("display_names") or not d2.get("timeout_transition"): sys.exit("display_names/timeout_transition missing")
print(f"dist v2 OK: {len(files)} files, {sum(os.path.getsize(p) for p in files)} bytes, {len(refs)} referenced assets")
