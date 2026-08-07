#!/usr/bin/env python3
"""
TOEIC Podcast Audio Generator
Reads all_articles_podcast.json, generates MP3 per article using edge-tts,
saves to TOEIC_Podcast/ with structured naming.
"""

import json
import os
import re
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path
from datetime import datetime

# ============================================================
# CONFIG
# ============================================================

BASE_DIR = Path(__file__).parent
ARTICLES_FILE = BASE_DIR / "all_articles_podcast.json"
OUTPUT_DIR = BASE_DIR / "TOEIC_Podcast"
LOG_FILE = OUTPUT_DIR / "podcast_generation_log.json"
TEMP_DIR = Path(tempfile.mkdtemp(prefix="podcast_"))

# Voice assignments
NARRATIVE_VOICES = [
    "en-US-ChristopherNeural",  # primary: authoritative male
    "en-US-AriaNeural",         # female diversity
    "en-GB-RyanNeural",         # British diversity
]
DEFAULT_NARRATIVE_VOICE = "en-US-ChristopherNeural"

# Dialogue voice pool
MALE_VOICES = ["en-US-ChristopherNeural", "en-GB-RyanNeural"]
FEMALE_VOICES = ["en-US-AriaNeural", "en-GB-SoniaNeural"]

# Speaker → gender mapping for dialogue articles
SPEAKER_GENDER = {
    # Male speakers
    "Man": "male", "Man 2": "male",
    "Interviewer": "male", "Fund Manager": "male",
    "Investor": "male", "IT Support": "male",
    "Supplier": "male", "Employee": "male",
    # Female speakers (for diversity and role variety)
    "Woman": "female", "Candidate": "female",
    "Buyer": "female", "Passenger": "female",
    "Agent": "female",
}

# Silence between dialogue segments (seconds)
SEGMENT_SILENCE = 0.4

# ============================================================
# HELPERS
# ============================================================

def run(cmd, **kwargs):
    """Run a command, return success."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, **kwargs)
    return result.returncode == 0, result.stdout, result.stderr


def generate_tts(text, voice, output_path):
    """Generate TTS audio using edge-tts. Returns True on success."""
    # Clean text: remove quotes that might break shell
    # Write text to temp file to avoid shell escaping issues
    tmp_text = TEMP_DIR / f"tts_input_{hash(text) % 100000}.txt"
    tmp_text.write_text(text.strip())

    cmd = f'python3 -m edge_tts -f "{tmp_text}" -v {voice} --write-media "{output_path}" --rate +0% 2>&1'
    ok, stdout, stderr = run(cmd, timeout=120)
    tmp_text.unlink(missing_ok=True)
    return ok and Path(output_path).exists()


def generate_silence(duration_sec, sample_rate=24000, channels=1, sample_width=2):
    """Generate a silent WAV file, returns path."""
    path = TEMP_DIR / f"silence_{duration_sec}s.wav"
    n_samples = int(duration_sec * sample_rate)
    with wave.open(str(path), 'w') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(b'\x00' * (n_samples * sample_width * channels))
    return path


def mp3_to_wav(mp3_path, wav_path):
    """Convert MP3 to WAV using macOS afconvert."""
    ok, _, _ = run(f'afconvert -f WAVE -d LEI16 "{mp3_path}" "{wav_path}" 2>&1')
    return ok and wav_path.exists()


def wav_to_mp3(wav_path, mp3_path):
    """Convert WAV to MP3 using macOS afconvert."""
    ok, _, _ = run(f'afconvert -f mp3 -d aac "{wav_path}" "{mp3_path}" 2>&1')
    # afconvert with -f mp3 might not work directly; try alternative
    if not ok or not mp3_path.exists():
        ok, _, _ = run(f'afconvert -f mp3 -d .mp3 "{wav_path}" "{mp3_path}" 2>&1')
    if not ok or not mp3_path.exists():
        # Fallback: use Python to concatenate and afconvert to M4A then rename
        ok, _, _ = run(f'afconvert -f m4af -d aac "{wav_path}" "{mp3_path.with_suffix(".m4a")}" 2>&1')
    return ok


def concat_wavs(wav_paths, output_wav, silences=None):
    """
    Concatenate multiple WAV files into one.
    silences: list of (index, duration_sec) to insert silence after segment i.
    """
    params = None
    frames = []

    for wav_path in wav_paths:
        with wave.open(str(wav_path), 'rb') as wf:
            if params is None:
                params = wf.getparams()
            frames.append(wf.readframes(wf.getnframes()))

    if params is None:
        return False

    with wave.open(str(output_wav), 'wb') as wf:
        wf.setparams(params)
        silence_bytes = b'\x00' * (int(SEGMENT_SILENCE * params.framerate) * params.sampwidth * params.nchannels)
        for i, data in enumerate(frames):
            wf.writeframes(data)
            if i < len(frames) - 1:  # Add silence between all segments
                wf.writeframes(silence_bytes)

    return True


# ============================================================
# DIALOGUE PARSING
# ============================================================

def parse_dialogue(text):
    """
    Parse dialogue text into list of (speaker, text) segments.
    Handles patterns like 'Speaker: text' or 'Speaker 2: text'.
    """
    segments = []
    current_speaker = None
    current_text = []

    lines = text.strip().split('\n')
    speaker_pattern = re.compile(r'^([A-Z][a-z]+(?:\s+\d+)?):\s*(.*)')

    for line in lines:
        m = speaker_pattern.match(line)
        if m:
            # Save previous segment
            if current_speaker and current_text:
                segments.append((current_speaker, ' '.join(current_text)))
            current_speaker = m.group(1)
            current_text = [m.group(2)] if m.group(2) else []
        else:
            if current_speaker and line.strip():
                current_text.append(line.strip())

    # Don't forget the last segment
    if current_speaker and current_text:
        segments.append((current_speaker, ' '.join(current_text)))

    return segments


def assign_voices(speakers):
    """Assign voices to unique speakers, mixing male/female and accent diversity."""
    male_idx = 0
    female_idx = 0
    voice_map = {}

    for speaker in speakers:
        gender = SPEAKER_GENDER.get(speaker, "male")  # default male for unknown
        if gender == "male":
            voice_map[speaker] = MALE_VOICES[male_idx % len(MALE_VOICES)]
            male_idx += 1
        else:
            voice_map[speaker] = FEMALE_VOICES[female_idx % len(FEMALE_VOICES)]
            female_idx += 1

    return voice_map


# ============================================================
# NAMING
# ============================================================

def compute_filenames(articles):
    """Group articles by scene and compute output filenames per rule."""
    from collections import OrderedDict
    scenes = OrderedDict()
    for art in articles:
        s = art['scene']
        if s not in scenes:
            scenes[s] = []
        scenes[s].append(art)

    filename_map = {}  # article_id → output_filename
    idx = 1
    for scene, arts in scenes.items():
        count = len(arts)
        for i, art in enumerate(arts):
            if count == 1:
                fname = f"{idx:02d} {scene}.mp3"
            else:
                fname = f"{idx:02d} {scene}（{i+1}）.mp3"
            filename_map[art['id']] = fname
        idx += 1

    return filename_map


# ============================================================
# MAIN GENERATION LOGIC
# ============================================================

def generate_article(art, output_path, narrative_voice_counter):
    """Generate audio for a single article. Returns dict with result info."""
    text = art['passage']
    art_type = art['type']
    title = art['title']
    art_id = art['id']

    print(f"  [{art_id}] {title} ({art_type}, {art['word_count']} words)")

    if art_type == 'article' or not parse_dialogue(text):
        # Narrative: single voice
        voice = NARRATIVE_VOICES[narrative_voice_counter % len(NARRATIVE_VOICES)]
        print(f"    Voice: {voice}")
        ok = generate_tts(text, voice, output_path)
        return {
            "article_id": art_id,
            "title": title,
            "type": art_type,
            "voice": voice,
            "status": "success" if ok else "failed",
            "time": datetime.now().isoformat()
        }

    else:
        # Dialogue: multi-voice with concatenation
        segments = parse_dialogue(text)
        speakers = list(dict.fromkeys([s for s, _ in segments]))  # unique, preserve order
        voice_map = assign_voices(speakers)

        print(f"    Speakers: {speakers}")
        for sp, v in voice_map.items():
            print(f"      {sp} → {v}")

        # Generate each segment
        segment_wavs = []
        for i, (speaker, seg_text) in enumerate(segments):
            voice = voice_map[speaker]
            mp3_path = TEMP_DIR / f"{art_id}_seg{i}.mp3"
            wav_path = TEMP_DIR / f"{art_id}_seg{i}.wav"

            ok = generate_tts(seg_text, voice, mp3_path)
            if not ok:
                print(f"    FAILED segment {i}: {speaker}")
                return {
                    "article_id": art_id, "title": title, "type": art_type,
                    "voice": "multi", "status": "failed",
                    "time": datetime.now().isoformat()
                }

            # Convert to WAV for concatenation
            ok = mp3_to_wav(mp3_path, wav_path)
            if ok:
                segment_wavs.append(wav_path)
            mp3_path.unlink(missing_ok=True)

        # Concatenate WAVs with silence between
        concat_wav = TEMP_DIR / f"{art_id}_concat.wav"
        ok = concat_wavs(segment_wavs, concat_wav)

        if not ok:
            print(f"    FAILED concatenation")
            return {
                "article_id": art_id, "title": title, "type": art_type,
                "voice": "multi", "status": "failed",
                "time": datetime.now().isoformat()
            }

        # Convert to final MP3
        ok, _, _ = run(f'afconvert -f mp3 -d .mp3 "{concat_wav}" "{output_path}" 2>&1')
        if not ok or not output_path.exists():
            # Try alternate format then rename
            m4a_path = output_path.with_suffix('.m4a')
            ok2, _, _ = run(f'afconvert -f m4af -d aac "{concat_wav}" "{m4a_path}" 2>&1')
            if ok2 and m4a_path.exists():
                m4a_path.rename(output_path)
                ok = True
            else:
                ok = False

        # Cleanup temp wavs
        for w in segment_wavs:
            w.unlink(missing_ok=True)
        concat_wav.unlink(missing_ok=True)

        status = "success" if ok else "failed"
        print(f"    Status: {status}")
        return {
            "article_id": art_id, "title": title, "type": art_type,
            "voice": "multi", "voice_map": voice_map,
            "status": status,
            "time": datetime.now().isoformat()
        }


def main():
    # Load articles
    with open(ARTICLES_FILE, 'r') as f:
        articles = json.load(f)

    print(f"Loaded {len(articles)} articles from {ARTICLES_FILE}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Temp directory: {TEMP_DIR}")
    print()

    # Create output dir
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Compute filenames
    filename_map = compute_filenames(articles)

    # Print plan
    print("=" * 60)
    print("GENERATION PLAN")
    print("=" * 60)
    for art in articles:
        fname = filename_map[art['id']]
        art_type = art['type']
        print(f"  {fname}  ←  [{art_type}] {art['title']}")
    print()

    # Load existing log if any
    log = []
    if LOG_FILE.exists():
        with open(LOG_FILE, 'r') as f:
            log = json.load(f)
        completed = {r['article_id'] for r in log if r['status'] == 'success'}
        print(f"Resuming: {len(completed)}/{len(articles)} already completed")
        print()

    completed_ids = {r['article_id'] for r in log if r['status'] == 'success'}

    # Generate
    narrative_voice_counter = 0
    for i, art in enumerate(articles):
        art_id = art['id']
        fname = filename_map[art_id]
        output_path = OUTPUT_DIR / fname

        # Skip completed
        if art_id in completed_ids:
            print(f"[{i+1}/{len(articles)}] SKIP (already done): {fname}")
            continue

        # Skip if output file already exists
        if output_path.exists():
            print(f"[{i+1}/{len(articles)}] SKIP (file exists): {fname}")
            log.append({
                "article_id": art_id, "title": art['title'],
                "output_file": fname, "type": art['type'],
                "status": "success", "time": datetime.now().isoformat()
            })
            continue

        print(f"[{i+1}/{len(articles)}] Generating: {fname}")
        result = generate_article(art, output_path, narrative_voice_counter)

        if art['type'] == 'article':
            narrative_voice_counter += 1

        result["output_file"] = fname
        log.append(result)

        # Save log after each article for crash recovery
        with open(LOG_FILE, 'w') as f:
            json.dump(log, f, indent=2, ensure_ascii=False)

        if result['status'] == 'success':
            file_size = output_path.stat().st_size if output_path.exists() else 0
            print(f"    ✅ Done ({file_size} bytes)")
        else:
            print(f"    ❌ Failed")

        print()

    # Final summary
    succeeded = sum(1 for r in log if r['status'] == 'success')
    failed = sum(1 for r in log if r['status'] == 'failed')
    print("=" * 60)
    print(f"SUMMARY: {succeeded} succeeded, {failed} failed, {len(articles)} total")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Log: {LOG_FILE}")
    print("=" * 60)

    if failed > 0:
        print("\nFailed articles:")
        for r in log:
            if r['status'] == 'failed':
                print(f"  ❌ {r['article_id']}: {r['title']}")


if __name__ == "__main__":
    main()
