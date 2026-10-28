"""Assemble the authored UTF-8 chapters without rewriting story or save identifiers."""
import argparse
import json
import os
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def assemble():
    metadata = read_json(ROOT / 'story' / 'metadata.json')
    scene_order = metadata.pop('sceneOrder')
    chapter_order = metadata.pop('chapterOrder')
    chapters, scenes = [], {}
    for chapter_id in chapter_order:
        source = read_json(ROOT / 'story' / 'chapters' / (chapter_id + '.json'))
        chapter = source['chapter']
        if chapter['id'] != chapter_id or set(chapter['scenes']) != set(source['scenes']):
            raise ValueError('Chapter scene membership mismatch: ' + chapter_id)
        for key, scene in source['scenes'].items():
            if key in scenes or scene['id'] != key:
                raise ValueError('Duplicate or mismatched scene: ' + key)
            scenes[key] = scene
        chapters.append(chapter)
    if set(scene_order) != set(scenes) or len(scene_order) != len(scenes):
        raise ValueError('Scene order must contain each scene exactly once')
    story = {**metadata, 'scenes': {key: scenes[key] for key in scene_order}, 'chapters': chapters}
    validate(story)
    return story


def validate(story):
    art = read_json(ROOT / 'assets' / 'manifest.json')
    scenes = story['scenes']
    def targets(value):
        return [value] if isinstance(value, str) else [row['to'] for row in value or []]
    def rule(value):
        if not value:
            return
        if 'all' in value or 'any' in value:
            for child in value.get('all', value.get('any')):
                rule(child)
        elif 'not' in value:
            rule(value['not'])
        elif 'evidence' in value:
            if value['evidence'] not in story['evidence']:
                raise ValueError('Unknown evidence condition')
        elif 'stat' in value:
            if value['stat'] not in ['trust', 'zhou', 'self']:
                raise ValueError('Unknown relationship condition')
        elif 'flag' not in value and 'minEvidence' not in value:
            raise ValueError('Unknown condition')
    for chapter in story['chapters']:
        if chapter['entry'] not in chapter['scenes']:
            raise ValueError('Missing chapter entry')
    for key, scene in scenes.items():
        if scene['bg'] not in art['backgrounds'] or not scene['beats']:
            raise ValueError('Missing background or beats: ' + key)
        exits = targets(scene.get('next'))
        for choice in scene.get('choices', []):
            exits += targets(choice['next'])
            rule(choice.get('when'))
            for target in choice['next'] if isinstance(choice['next'], list) else []:
                rule(target.get('when'))
        if not scene.get('ending') and not exits:
            raise ValueError('Missing exit: ' + key)
        if any(target not in scenes for target in exits):
            raise ValueError('Broken scene exit: ' + key)
        for beat in scene['beats']:
            if not isinstance(beat['text'], str) or not beat['text']:
                raise ValueError('Empty dialogue: ' + key)
            rule(beat.get('when'))
            for variant in beat.get('variants', []):
                if not isinstance(variant.get('text'), str) or not variant['text'] or 'when' not in variant:
                    raise ValueError('Invalid dialogue variant: ' + key)
                rule(variant['when'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify generated data without writing')
    parser.add_argument('--output', type=Path, default=ROOT / 'src' / 'story.json')
    args = parser.parse_args()
    story = assemble()
    content = (json.dumps(story, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    if args.check:
        if not args.output.exists() or args.output.read_bytes() != content:
            raise SystemExit('Generated story is stale; run python tools/build_story.py')
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=args.output.parent, prefix='.story-', delete=False) as handle:
                temporary = Path(handle.name)
                handle.write(content)
                handle.flush()
                os.fsync(handle.fileno())
            temporary.replace(args.output)
        finally:
            if temporary is not None and temporary.exists():
                temporary.unlink()
    print(f"Validated {len(story['chapters'])} chapters, {len(story['scenes'])} scenes, UTF-8 output")


if __name__ == '__main__':
    main()
