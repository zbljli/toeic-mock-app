#!/usr/bin/env python3
"""
Integrate podcast MP3s into the app:
1. Match articles between all_articles_podcast.json → articles.json
2. Compute correct filenames based on app's scene/article structure
3. Copy/rename MP3s to assets/audio/podcast/
4. Update articles.json with audio_url + duration fields
5. Remove placeholder MP3s from TOEIC_Podcast/
"""

import json
import os
import shutil
import subprocess
from pathlib import Path
from collections import OrderedDict

BASE_DIR = Path(__file__).parent
PODCAST_DIR = BASE_DIR / "TOEIC_Podcast"
ASSETS_DIR = BASE_DIR / "assets" / "audio" / "podcast"
ARTICLES_FILE = BASE_DIR / "src" / "data" / "articles.json"
SCENES_FILE = BASE_DIR / "src" / "data" / "scenes.json"
PODCAST_JSON = BASE_DIR / "all_articles_podcast.json"

# Load data
with open(PODCAST_JSON) as f:
    podcast_articles = json.load(f)
with open(ARTICLES_FILE) as f:
    app_articles = json.load(f)
with open(SCENES_FILE) as f:
    scenes = json.load(f)

# Build scene ID → scene name mapping from scenes.json
scene_map = {s['id']: s for s in scenes}

# Build podcast article lookup by ID
podcast_by_id = {}
for a in podcast_articles:
    podcast_by_id[a['id']] = a

# Build scene name → scene ID reverse map from podcast data
# (podcast uses full scene names, app uses scene IDs)
podcast_scene_to_app_scene = {}
for a in podcast_articles:
    for s in scenes:
        if s['name'] == a['scene']:
            podcast_scene_to_app_scene[a['scene']] = s['id']
            break

print("=== Scene mapping (podcast name → app ID) ===")
for k, v in podcast_scene_to_app_scene.items():
    print(f"  {k} → {v}")

# Compute scene ordering from app articles (by sceneId)
app_scene_order = []
seen_scenes = set()
for a in app_articles:
    sid = a['sceneId']
    if sid not in seen_scenes:
        seen_scenes.add(sid)
        app_scene_order.append(sid)

print(f"\nApp scene order ({len(app_scene_order)} scenes):")
for i, sid in enumerate(app_scene_order):
    info = scene_map.get(sid, {})
    count = sum(1 for a in app_articles if a['sceneId'] == sid)
    print(f"  {i+1:02d}: {sid} ({info.get('name', '?')}) — {count} articles")

# Compute audio filenames for each app article
print("\n=== Computing filenames ===")
idx = 1
filename_map = {}  # article_id → output_filename
for sid in app_scene_order:
    scene_articles = [a for a in app_articles if a['sceneId'] == sid]
    count = len(scene_articles)
    scene_name = scene_map.get(sid, {}).get('name', sid)
    for i, a in enumerate(scene_articles):
        if count == 1:
            fname = f"{idx:02d} {scene_name}.mp3"
        else:
            fname = f"{idx:02d} {scene_name}（{i+1}）.mp3"
        filename_map[a['id']] = fname
    idx += 1

# Print match status
matched = 0
missing = 0
placeholders_skipped = 0
for a in app_articles:
    aid = a['id']
    podcast = podcast_by_id.get(aid)
    fname = filename_map.get(aid)
    if podcast:
        if podcast['word_count'] >= 50:
            print(f"  ✅ {aid}: {a['title']} → {fname}")
            matched += 1
        else:
            print(f"  ⚠️  SKIP (placeholder, {podcast['word_count']} words): {aid}: {a['title']}")
            placeholders_skipped += 1
    else:
        print(f"  ❌ NO MATCH: {aid}: {a['title']}")
        missing += 1

print(f"\nSummary: {matched} real matches, {placeholders_skipped} placeholders skipped, {missing} missing")

# ── Step 1: Create assets/audio/podcast/ ──
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

# ── Step 2: Copy and rename MP3s ──
print("\n=== Copying MP3s to assets ===")
updates = []  # articles.json updates

# First, identify the source → destination mapping
# The podcast files were named based on the old (with placeholders) structure
# We need to look up the OLD filename from the podcast generation
old_filename_map = {}  # article_id → old filename (from podcast generation)
idx = 1
scene_order_old = []
for a in podcast_articles:
    if a['scene'] not in scene_order_old:
        scene_order_old.append(a['scene'])

for scene_name in scene_order_old:
    scene_arts = [a for a in podcast_articles if a['scene'] == scene_name]
    count = len(scene_arts)
    for i, a in enumerate(scene_arts):
        if count == 1:
            fname = f"{idx:02d} {scene_name}.mp3"
        else:
            fname = f"{idx:02d} {scene_name}（{i+1}）.mp3"
        old_filename_map[a['id']] = fname
    idx += 1

for a in app_articles:
    aid = a['id']
    podcast = podcast_by_id.get(aid)
    old_fname = old_filename_map.get(aid)
    new_fname = filename_map.get(aid)

    if not podcast or podcast['word_count'] < 50:
        continue

    old_path = PODCAST_DIR / old_fname
    new_path = ASSETS_DIR / new_fname

    if old_path.exists():
        shutil.copy2(old_path, new_path)
        # Get audio duration from ffprobe-like output
        result = subprocess.run(
            ['afinfo', str(new_path)],
            capture_output=True, text=True
        )
        duration = 0
        for line in result.stdout.split('\n'):
            if 'estimated duration' in line.lower():
                try:
                    # Format: "estimated duration: 147.120000 sec"
                    duration = float(line.strip().split(':')[1].strip().split()[0])
                except:
                    pass

        # Use estimated duration from podcast data if afinfo fails
        if not duration:
            duration = podcast.get('duration_est_min', 0) * 60

        updates.append({
            'id': aid,
            'audio_url': f'assets/audio/podcast/{new_fname}',
            'duration': round(duration),
            'old_title': a['title'],
        })
        print(f"  ✅ {old_fname} → assets/audio/podcast/{new_fname} ({round(duration)}s)")
    else:
        # Try to find the file by checking if old filename format differs
        print(f"  ⚠️  Source not found: {old_fname} (looking for {old_path})")

# ── Step 3: Update articles.json ──
print("\n=== Updating articles.json ===")
update_map = {u['id']: u for u in updates}

for a in app_articles:
    u = update_map.get(a['id'])
    if u:
        a['audio_url'] = u['audio_url']
        a['duration'] = u['duration']
        print(f"  ✅ {a['id']}: audio_url={u['audio_url']}, duration={u['duration']}s")
    else:
        a['audio_url'] = ''
        a['duration'] = 0

# Save updated articles.json
with open(ARTICLES_FILE, 'w') as f:
    json.dump(app_articles, f, indent=2, ensure_ascii=False)

# ── Step 4: Remove placeholder MP3s from TOEIC_Podcast ──
print("\n=== Cleaning placeholder MP3s ===")
placeholders_removed = 0
for aid, old_fname in old_filename_map.items():
    podcast = podcast_by_id.get(aid)
    if podcast and podcast['word_count'] < 50:
        p = PODCAST_DIR / old_fname
        if p.exists():
            p.unlink()
            print(f"  🗑️  Removed: {old_fname}")
            placeholders_removed += 1

print(f"\n{'='*60}")
print(f"INTEGRATION COMPLETE")
print(f"{'='*60}")
print(f"  Real articles with audio: {len(updates)}")
print(f"  Placeholder MP3s removed:  {placeholders_removed}")
print(f"  Assets directory:          {ASSETS_DIR}")
print(f"  Updated file:              {ARTICLES_FILE}")
print(f"  Podcast files kept:        {len(updates)} (in TOEIC_Podcast/)")
print(f"{'='*60}")
