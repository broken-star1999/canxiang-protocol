#!/usr/bin/env python3
"""合并 story/ 各段最高版本 + puzzle/*endings_v*.yaml 最高版本 + art/out 图片清单 -> data.json / data.js"""
import json, os, re, glob, yaml
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
def latest(files, rx):
    best = {}
    for f in files:
        m = re.match(rx, os.path.basename(f))
        if not m: continue
        k, v = m.group(1), int(m.group(2))
        if k not in best or v > best[k][0]: best[k] = (v, f)
    return [best[k][1] for k in sorted(best)]
segs = latest(glob.glob(os.path.join(ROOT, "story", "*.yaml")), r"(.+?)_draft_v(\d+)\.ya?ml$")
D = {"values": {}, "clock_start": "00:00", "scenes": [], "endings": [], "bonuses": [], "self_endings": [], "_sources": []}
for f in segs:
    d = yaml.safe_load(open(f, encoding="utf-8")) or {}
    if not D["scenes"]:
        D["values"] = d.get("values", {}); D["clock_start"] = d.get("clock_start", "00:00")
    D["scenes"] += d.get("scenes") or []
    for k in ("endings", "bonuses", "self_endings"): D[k] += d.get(k) or []
    D["_sources"].append(os.path.relpath(f, ROOT))
for f in latest(glob.glob(os.path.join(ROOT, "puzzle", "*endings_v*.yaml")), r"(.*endings)_v(\d+)\.ya?ml$"):
    d = yaml.safe_load(open(f, encoding="utf-8")) or {}
    for k in ("endings", "bonuses", "self_endings"): D[k] += d.get(k) or []
    D["_sources"].append(os.path.relpath(f, ROOT))
# 图片：art/out/ 下取最高 vN；samples 作后备
imgs = {}
def add(key, pattern):
    vs = []
    for f in glob.glob(os.path.join(ROOT, "art", "out", "**", pattern), recursive=True):
        m = re.search(r"_v(\d+)\.webp$", f)
        if m: vs.append((int(m.group(1)), f))
    if vs: imgs[key] = os.path.relpath(max(vs)[1], HERE)
fallback = {"scene_bay7_poweroff": "../samples/scene_bay7_poweroff_v2.png", "mira_lv1": "../samples/portrait_mira_lv1_v1.png"}
for s in D["scenes"]:
    for k in filter(None, [s.get("bg"), s.get("portrait")]): add(k, f"{k}_v*.webp")
    for c in s.get("choices") or []: add("thumb:" + c["id"], f"thumb_{c['id']}_v*.webp")
for e in D["endings"]: add("ending:" + e["id"], f"ending_{e['id']}_v*.webp")
for k, v in fallback.items():
    if k not in imgs and os.path.exists(os.path.join(HERE, v)): imgs[k] = v
D["images"] = imgs
s = json.dumps(D, ensure_ascii=False, indent=1)
open(os.path.join(HERE, "data.json"), "w", encoding="utf-8").write(s)
open(os.path.join(HERE, "data.js"), "w", encoding="utf-8").write("window.STORY=" + s + ";")
print("sources:", *D["_sources"], f"| scenes={len(D['scenes'])} endings={len(D['endings'])} bonuses={len(D['bonuses'])} images={len(imgs)}")
