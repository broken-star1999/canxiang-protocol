#!/usr/bin/env python3
"""Merge chapter YAML and art assets into data.json / data.js."""
import glob
import json
import os
import re

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def natural_key(value):
    return tuple(int(part) if part.isdigit() else part.casefold()
                 for part in re.split(r"(\d+)", value))


def latest(files, rx):
    best = {}
    for filename in sorted(files):
        match = re.match(rx, os.path.basename(filename))
        if not match:
            continue
        key, version = match.group(1), int(match.group(2))
        if key not in best or version > best[key][0]:
            best[key] = (version, filename)
    return [best[key][1] for key in sorted(best, key=natural_key)]


def load_yaml(filename):
    with open(filename, encoding="utf-8") as stream:
        return yaml.safe_load(stream) or {}


story_segments = latest(
    glob.glob(os.path.join(ROOT, "story", "*.yaml")),
    r"(.+?)_draft_v(\d+)\.ya?ml$",
)
puzzle_sources = latest(
    glob.glob(os.path.join(ROOT, "puzzle", "*endings_v*.yaml")),
    r"(.*endings)_v(\d+)\.ya?ml$",
)
D = {
    "values": {}, "clock_start": "00:00", "scenes": [], "endings": [],
    "bonuses": [], "self_endings": [], "portrait_overrides": [],
    "_sources": [], "_portrait_override_sources": [],
    "_portrait_override_skipped": [],
}
story_override_pairs = set()


def merge_chapter_data(filename, *, first_segment=False, is_story=False):
    data = load_yaml(filename)
    relative = os.path.relpath(filename, ROOT).replace(os.sep, "/")
    if first_segment:
        D["values"] = data.get("values", {})
        D["clock_start"] = data.get("clock_start", "00:00")
    D["scenes"] += data.get("scenes") or []
    for key in ("endings", "bonuses", "self_endings"):
        D[key] += data.get(key) or []
    overrides = data.get("portrait_overrides") or []
    if isinstance(overrides, list):
        for override in overrides:
            if not isinstance(override, dict):
                continue
            D["portrait_overrides"].append(override)
            D["_portrait_override_sources"].append(relative)
            if is_story:
                story_override_pairs.add((override.get("from"), override.get("to")))
    D["_sources"].append(relative)


for index, filename in enumerate(story_segments):
    merge_chapter_data(filename, first_segment=index == 0, is_story=True)
for filename in puzzle_sources:
    merge_chapter_data(filename)

# Prototype-specific overrides are deliberately lower priority than chapter data.
prototype_overrides = os.path.join(HERE, "overrides.yaml")
if os.path.exists(prototype_overrides):
    data = load_yaml(prototype_overrides)
    relative = os.path.relpath(prototype_overrides, ROOT).replace(os.sep, "/")
    for override in data.get("portrait_overrides") or []:
        if not isinstance(override, dict):
            continue
        pair = (override.get("from"), override.get("to"))
        if pair in story_override_pairs:
            D["_portrait_override_skipped"].append(relative)
            continue
        D["portrait_overrides"].append(override)
        D["_portrait_override_sources"].append(relative)
    D["_sources"].append(relative)


# Scan art/out once. Ignore generated drafts at any directory depth.
ART_OUT = os.path.join(ROOT, "art", "out")
art_files = []
if os.path.isdir(ART_OUT):
    for directory, subdirs, filenames in os.walk(ART_OUT):
        subdirs[:] = [name for name in subdirs if name != "_draft_genimage"]
        for filename in filenames:
            if filename.lower().endswith((".webp", ".png")):
                art_files.append(os.path.join(directory, filename))

imgs = {}


def add(key, *stems):
    candidates = []
    for stem_index, stem in enumerate(stems):
        matcher = re.compile(r"^" + re.escape(stem) + r"_v(\d+)\.(webp|png)$", re.IGNORECASE)
        for filename in art_files:
            match = matcher.match(os.path.basename(filename))
            if match:
                version = int(match.group(1))
                webp = match.group(2).lower() == "webp"
                candidates.append((version, webp, -stem_index, filename))
    if candidates:
        chosen = max(candidates, key=lambda item: (item[0], item[1], item[2], item[3]))[3]
        imgs[key] = os.path.relpath(chosen, HERE).replace(os.sep, "/")


def add_portrait(name):
    if name:
        add(name, "portrait_" + name, name)


fallback = {
    "scene_bay7_poweroff": "../samples/scene_bay7_poweroff_v2.png",
    "mira_lv1": "../samples/portrait_mira_lv1_v1.png",
}
for scene in D["scenes"]:
    if scene.get("bg"):
        add(scene["bg"], scene["bg"])
    add_portrait(scene.get("portrait"))
    for choice in scene.get("choices") or []:
        add("thumb:" + choice["id"], "thumb_" + choice["id"])
for ending in D["endings"]:
    add("ending:" + ending["id"], "ending_" + ending["id"])
for override in D["portrait_overrides"]:
    add_portrait(override.get("to"))
for key, filename in fallback.items():
    if key not in imgs and os.path.exists(os.path.join(HERE, filename)):
        imgs[key] = filename
D["images"] = imgs

serialized = json.dumps(D, ensure_ascii=False, indent=1)
with open(os.path.join(HERE, "data.json"), "w", encoding="utf-8") as stream:
    stream.write(serialized)
with open(os.path.join(HERE, "data.js"), "w", encoding="utf-8") as stream:
    stream.write("window.STORY=" + serialized + ";")

print(
    "sources:", *D["_sources"],
    f"| scenes={len(D['scenes'])} endings={len(D['endings'])} "
    f"bonuses={len(D['bonuses'])} portrait_overrides={len(D['portrait_overrides'])} "
    f"images={len(imgs)}",
)
for override, source in zip(D["portrait_overrides"], D["_portrait_override_sources"]):
    print("portrait_override:", source, override)
for source in D["_portrait_override_skipped"]:
    print("portrait_override duplicate skipped:", source, "(story already has the same from+to)")
