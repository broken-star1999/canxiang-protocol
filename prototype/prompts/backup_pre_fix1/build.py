#!/usr/bin/env python3
"""Build the static multi-chapter data bundle from YAML and art assets."""
from __future__ import annotations

import glob
import json
import os
import re
import sys

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def natural_key(value):
    return tuple(int(part) if part.isdigit() else part.casefold()
                 for part in re.split(r"(\d+)", str(value)))


def load_yaml(filename):
    with open(filename, encoding="utf-8") as stream:
        return yaml.safe_load(stream) or {}


def rel_root(filename):
    return os.path.relpath(filename, ROOT).replace(os.sep, "/")


def highest_version(files, pattern):
    """Return one highest-version file for each captured stem, webp on ties."""
    best = {}
    for filename in files:
        match = re.match(pattern, os.path.basename(filename), re.IGNORECASE)
        if not match:
            continue
        stem, version = match.group(1), int(match.group(2))
        ext = os.path.splitext(filename)[1].lower()
        rank = (version, ext == ".webp", filename)
        if stem not in best or rank > best[stem][0]:
            best[stem] = (rank, filename)
    return {stem: row[1] for stem, row in best.items()}


def latest_named_version(filename):
    """Resolve the highest _vN sibling for an indexed YAML path."""
    folder, base = os.path.split(filename)
    match = re.match(r"^(.*?)_v(\d+)(\.ya?ml)$", base, re.IGNORECASE)
    if not match:
        return filename if os.path.isfile(filename) else None
    prefix, _, ext = match.groups()
    candidates = glob.glob(os.path.join(folder, prefix + "_v*" + ext))
    rows = highest_version(candidates, r"(.*?)_v(\d+)\.ya?ml$")
    return rows.get(prefix)


def find_story_source(prefix):
    candidates = glob.glob(os.path.join(ROOT, "story", prefix + "_draft_v*.yaml"))
    rows = highest_version(candidates, r"(.*?)_draft_v(\d+)\.ya?ml$")
    return rows.get(prefix)


def parse_path(value):
    return os.path.join(ROOT, *str(value).split("/"))


index_path = os.path.join(ROOT, "chapters", "index.yaml")
echoes_path = os.path.join(ROOT, "chapters", "echoes.yaml")
foreshadow_path = os.path.join(ROOT, "chapters", "foreshadow.yaml")
index_data = load_yaml(index_path)
echoes = load_yaml(echoes_path)
foreshadow = load_yaml(foreshadow_path)
chapter_specs = index_data.get("chapters") or []

effects_candidates = glob.glob(os.path.join(ROOT, "puzzle", "c1_effects_v*.yaml"))
effect_versions = highest_version(effects_candidates, r"(c1_effects)_v(\d+)\.ya?ml$")
effects_file = effect_versions.get("c1_effects")
if not effects_file:
    raise SystemExit("缺少 puzzle/c1_effects_vN.yaml")
effects_data = load_yaml(effects_file)

fin_endings_file = None
fin_ending_sources = glob.glob(os.path.join(ROOT, "puzzle", "c1_endings_v*.yaml"))
fin_ending_versions = highest_version(fin_ending_sources, r"(c1_endings)_v(\d+)\.ya?ml$")
if fin_ending_versions:
    fin_endings_file = fin_ending_versions["c1_endings"]

chapters = []
all_sources = [rel_root(index_path), rel_root(echoes_path), rel_root(foreshadow_path)]
for spec in chapter_specs:
    chapter = dict(spec)
    sources = []
    for prefix in chapter.get("scene_sources") or []:
        source = find_story_source(prefix)
        if source:
            sources.append(source)
    sources.sort(key=lambda f: natural_key(os.path.basename(f)))

    scenes = []
    story_choices = {}
    for source in sources:
        data = load_yaml(source)
        all_sources.append(rel_root(source))
        for scene in data.get("scenes") or []:
            for choice in scene.get("choices") or []:
                choice_id = choice.get("id")
                if choice_id:
                    story_choices[choice_id] = choice
            scenes.append(scene)

    chapter_endings = []
    endings_file = chapter.get("endings_file")
    if endings_file:
        requested = parse_path(endings_file)
        actual = latest_named_version(requested)
        if actual:
            ending_data = load_yaml(actual)
            chapter_endings = ending_data.get("endings") or []
            chapter["safety_cards"] = ending_data.get("safety_cards") or {}
            all_sources.append(rel_root(actual))

    chapter["scenes"] = scenes
    chapter["endings"] = chapter_endings
    chapter["bonuses"] = []
    chapter["self_endings"] = []
    chapter["echoes"] = echoes if isinstance(echoes, list) else []
    chapter["foreshadow"] = foreshadow if isinstance(foreshadow, list) else []
    chapter["clock_start"] = (chapter.get("clock") or {}).get("start", "00:00")
    chapter["closing_scene"] = (chapter.get("clock") or {}).get("closing_scene")
    defaults = (chapter.get("values_in") or {}).get("defaults") or {}
    chapter["values"] = defaults
    chapter["_sources"] = [rel_root(path) for path in sources]

    if chapter.get("id") == "c1":
        yaml_choices = effects_data if isinstance(effects_data, dict) else {}
        yaml_ids, story_ids = set(yaml_choices), set(story_choices)
        missing_yaml = sorted(story_ids - yaml_ids, key=natural_key)
        missing_story = sorted(yaml_ids - story_ids, key=natural_key)
        if missing_yaml or missing_story:
            print("effects 与剧本选项不一致；构建终止。", file=sys.stderr)
            if missing_yaml:
                print("剧本有、effects 无: " + ", ".join(missing_yaml), file=sys.stderr)
            if missing_story:
                print("effects 有、剧本无: " + ", ".join(missing_story), file=sys.stderr)
            raise SystemExit(1)
        for choice_id, choice in story_choices.items():
            effect_row = yaml_choices[choice_id] or {}
            if "key" in effect_row and bool(effect_row["key"]) != bool(choice.get("key", False)):
                print(f"警告: {choice_id} key 不一致（story={choice.get('key', False)!r}, effects={effect_row['key']!r}）")
            choice["effects"] = effect_row.get("effects") or {}
        all_sources.append(rel_root(effects_file))
        chapter["_sources"].append(rel_root(effects_file))

    chapters.append(chapter)

if fin_endings_file:
    fin_data = load_yaml(fin_endings_file)
    fin_specs = next((c for c in chapters if c.get("id") == "fin"), None)
    c2_specs = next((c for c in chapters if c.get("id") == "c2"), None)
    if fin_specs is not None:
        fin_specs["fin_endings"] = fin_data.get("endings") or []
        fin_specs["endings"] = fin_data.get("endings") or []
        fin_specs["bonuses"] = []
        fin_specs["self_endings"] = fin_data.get("self_endings") or []
    # A.7 moves the paired Zhou reward into chapter two; the endings stay in fin.
    if c2_specs is not None:
        c2_specs["bonuses"] = fin_data.get("bonuses") or []
    all_sources.append(rel_root(fin_endings_file))
else:
    fin_data = {}

# Keep the legacy top-level c1 view for tools that consumed the earlier bundle.
c1 = next((c for c in chapters if c.get("id") == "c1"), None)
D = {
    "game": index_data.get("game") or {},
    "chapters": chapters,
    "echoes": echoes if isinstance(echoes, list) else [],
    "foreshadow": foreshadow if isinstance(foreshadow, list) else [],
    "fin_endings": (fin_data.get("endings") or []),
    "fin_bonuses": (next((c for c in chapters if c.get("id") == "fin"), {}) or {}).get("bonuses", []),
    "fin_self_endings": fin_data.get("self_endings") or [],
    "scenes": (c1 or {}).get("scenes", []),
    "endings": (c1 or {}).get("endings", []),
    "values": (c1 or {}).get("values", {}),
    "clock_start": (c1 or {}).get("clock_start", "00:00"),
    "bonuses": [], "self_endings": [],
    "portrait_overrides": [], "_portrait_override_sources": [],
    "_portrait_override_skipped": [], "_sources": all_sources,
}

# Chapter-level portrait overrides retain order; prototype overrides are lower priority.
for chapter in chapters:
    for override in chapter.get("portrait_overrides") or []:
        D["portrait_overrides"].append(override)
        D["_portrait_override_sources"].append("chapters/index.yaml#" + chapter["id"])
prototype_overrides = os.path.join(HERE, "overrides.yaml")
if os.path.isfile(prototype_overrides):
    override_data = load_yaml(prototype_overrides)
    for override in override_data.get("portrait_overrides") or []:
        pair = (override.get("from"), override.get("to"))
        added_to_chapter = False
        for chapter in chapters:
            chapter_pairs = {(item.get("from"), item.get("to")) for item in chapter.get("portrait_overrides") or []}
            if pair not in chapter_pairs:
                chapter.setdefault("portrait_overrides", []).append(override)
                added_to_chapter = True
        if not added_to_chapter:
            D["_portrait_override_skipped"].append(rel_root(prototype_overrides))
            continue
        D["portrait_overrides"].append(override)
        D["_portrait_override_sources"].append(rel_root(prototype_overrides))
    D["_sources"].append(rel_root(prototype_overrides))

# Scan only usable raster assets and SVG icons. Generated draft directories are ignored.
ART_OUT = os.path.join(ROOT, "art", "out")
raster_files, icon_files = [], []
if os.path.isdir(ART_OUT):
    for directory, subdirs, filenames in os.walk(ART_OUT):
        subdirs[:] = [name for name in subdirs if name != "_draft_genimage"]
        for filename in filenames:
            full = os.path.join(directory, filename)
            lower = filename.lower()
            if lower.endswith((".webp", ".png")):
                raster_files.append(full)
            elif os.path.basename(directory) == "icons" and lower.endswith(".svg"):
                icon_files.append(full)

def image_choice(stems, files=raster_files):
    candidates = []
    for stem_index, stem in enumerate(stems):
        if not stem:
            continue
        matcher = re.compile(r"^" + re.escape(str(stem)) + r"_v(\d+)\.(webp|png)$", re.IGNORECASE)
        for filename in files:
            match = matcher.match(os.path.basename(filename))
            if match:
                candidates.append((int(match.group(1)), match.group(2).lower() == "webp", -stem_index, filename))
        exact = os.path.basename(str(stem))
        for filename in files:
            if os.path.basename(filename).casefold() == exact.casefold():
                candidates.append((0, filename.lower().endswith(".webp"), -stem_index, filename))
    if not candidates:
        return None
    return max(candidates, key=lambda row: (row[0], row[1], row[2], row[3]))[3]

def asset_path(filename):
    return os.path.relpath(filename, HERE).replace(os.sep, "/")

images = {}
for chapter in chapters:
    cid = chapter.get("id")
    chapter_stems = ["chapter_" + ("final" if cid == "fin" else cid), "chapter_" + cid, chapter.get("cover")]
    chapter_asset = image_choice(chapter_stems)
    if chapter_asset:
        images["chapter:" + cid] = asset_path(chapter_asset)
    for scene in chapter.get("scenes") or []:
        bg = scene.get("bg")
        if bg:
            asset = image_choice([bg])
            if asset:
                images[bg] = asset_path(asset)
        portrait = scene.get("portrait")
        if portrait:
            asset = image_choice(["portrait_" + portrait, portrait])
            if asset:
                images["portrait:" + portrait] = asset_path(asset)
        for choice in scene.get("choices") or []:
            thumb = image_choice(["thumb_" + str(choice.get("id", ""))])
            if thumb:
                images["thumb:" + choice["id"]] = asset_path(thumb)
    for ending in chapter.get("endings") or []:
        ending_id = ending.get("id")
        asset = image_choice(["ending_" + str(ending_id)])
        if not asset and ending.get("image"):
            fallback_stem = str(ending["image"]).removeprefix("bg/")
            asset = image_choice([fallback_stem])
        if asset:
            images["ending:" + ending_id] = asset_path(asset)
for ending in D["fin_endings"]:
    ending_id = ending.get("id")
    asset = image_choice(["ending_" + str(ending_id)])
    if not asset and ending.get("image"):
        asset = image_choice([str(ending["image"]).removeprefix("bg/")])
    if asset:
        images["ending:" + ending_id] = asset_path(asset)
for override in D["portrait_overrides"]:
    portrait = override.get("to")
    asset = image_choice(["portrait_" + str(portrait), portrait])
    if portrait and asset:
        images["portrait:" + portrait] = asset_path(asset)

# Keep the existing local sample fallbacks used by the earlier prototype.
for key, filename in {
    "scene_bay7_poweroff": "../samples/scene_bay7_poweroff_v2.png",
    "portrait:mira_lv1": "../samples/portrait_mira_lv1_v1.png",
}.items():
    full = os.path.join(HERE, filename)
    if key not in images and os.path.isfile(full):
        images[key] = filename

icon_map = {}
def icon_stem(filename):
    stem = os.path.splitext(os.path.basename(filename))[0]
    return re.sub(r"_v\d+$", "", stem, flags=re.IGNORECASE)

for filename in icon_files:
    stem = icon_stem(filename)
    icon_map.setdefault(stem, []).append(filename)
for echo in D["echoes"]:
    icon_name = echo.get("icon")
    candidates = icon_map.get(icon_name, [])
    if candidates:
        # No-version SVGs rank as v0; highest explicit version wins.
        def icon_rank(filename):
            m = re.search(r"_v(\d+)\.svg$", filename, re.IGNORECASE)
            return (int(m.group(1)) if m else 0, filename)
        images["icon:" + icon_name] = asset_path(max(candidates, key=icon_rank))
D["images"] = images
D["asset_inventory"] = {
    "rasters": [asset_path(f) for f in sorted(raster_files, key=lambda x: natural_key(os.path.basename(x)))],
    "icons": [asset_path(f) for f in sorted(icon_files, key=lambda x: natural_key(os.path.basename(x)))],
}

serialized = json.dumps(D, ensure_ascii=False, indent=1)
for filename, contents in (("data.json", serialized), ("data.js", "window.STORY=" + serialized + ";")):
    with open(os.path.join(HERE, filename), "w", encoding="utf-8") as stream:
        stream.write(contents)

print("sources:", *D["_sources"])
print(f"chapters={len(chapters)} c1_scenes={len(D['scenes'])} c1_endings={len(D['endings'])} "
      f"fin_endings={len(D['fin_endings'])} echoes={len(D['echoes'])} images={len(images)}")
for source in D["_portrait_override_skipped"]:
    print("portrait_override duplicate skipped:", source)
