/**
 * Offline audio pre-generation pipeline.
 *
 * Usage:  node scripts/generate-audio.cjs [--dry-run]
 *
 * 1. Reads all words from src/data/words.json (1280 words).
 * 2. Calls Free Dictionary API for each word to find real-human .mp3 URLs.
 * 3. Downloads .mp3 files → web/audio/{word}.mp3.
 * 4. Generates src/data/audioManifest.ts listing every word that has audio.
 *
 * Rate limit: ~400 requests / 15 minutes (API allows 450).
 * Total time: ~65 minutes for 1280 words.
 *
 * On subsequent runs, skips words that already have downloaded audio
 * (unless the .mp3 is missing or --force is passed).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Config ───────────────────────────────────────────────
const WORDS_PATH = path.join(__dirname, '..', 'src', 'data', 'words.json');
const AUDIO_DIR = path.join(__dirname, '..', 'web', 'audio');
const MANIFEST_PATH = path.join(__dirname, '..', 'src', 'data', 'audioManifest.ts');
const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

// Rate limiting: 400 req / 15 min → 1 req every 2.25 s.
// Use 2.5 s to be safe (360 req / 15 min).
const REQUEST_INTERVAL_MS = 2500;
const MAX_RETRIES = 2;

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

// ── Helpers ──────────────────────────────────────────────

/** Fetch JSON from a URL (lightweight — no dependencies). */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode === 429) {
        return reject(new Error('RATE_LIMITED'));
      }
      if (res.statusCode === 404) {
        return resolve(null); // word not found
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject).on('timeout', function () {
      this.destroy();
      reject(new Error('TIMEOUT'));
    });
  });
}

/** Download a file from `url` to `destPath`. */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (DRY_RUN) return resolve(true);
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
      file.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
    }).on('error', reject).on('timeout', function () {
      this.destroy();
      reject(new Error('TIMEOUT'));
    });
  });
}

/** Normalize a word for use as a filename. */
function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z0-9-]/g, '').trim();
}

/** Delay helper. */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  TOEIC Audio Pre-generation Pipeline');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log('  ⚠️  DRY RUN — no files will be written\n');

  // Load words
  const wordsData = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf-8'));
  const allWords = [...new Set(wordsData.map((w) => normalizeWord(w.word)))];
  console.log(`  📚 ${allWords.length} unique words in words.json\n`);

  // Ensure audio directory exists
  if (!DRY_RUN) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  // Collect existing audio files (for resume / skip)
  const existing = new Set();
  if (!FORCE && !DRY_RUN && fs.existsSync(AUDIO_DIR)) {
    for (const f of fs.readdirSync(AUDIO_DIR)) {
      if (f.endsWith('.mp3')) existing.add(f.replace('.mp3', ''));
    }
  }
  if (existing.size > 0) console.log(`  📁 ${existing.size} audio files already exist (skipping)\n`);

  // ── Fetch & download ──
  const results = { success: [], failed: [], skipped: [] };
  let apiCalls = 0;
  let downloads = 0;
  const startTime = Date.now();

  for (let i = 0; i < allWords.length; i++) {
    const word = allWords[i];
    const norm = normalizeWord(word);

    // Skip if already downloaded
    if (!FORCE && existing.has(norm)) {
      results.success.push(norm);
      results.skipped.push(norm);
      continue;
    }

    // Rate-limit pause (skip for the very first request)
    if (apiCalls > 0) await sleep(REQUEST_INTERVAL_MS);

    // ── Step 1: Fetch word entry from Free Dictionary API ──
    let audioUrl = null;
    let retries = 0;

    while (retries <= MAX_RETRIES) {
      try {
        const data = await fetchJson(`${API_BASE}/${encodeURIComponent(norm)}`);
        apiCalls++;

        if (data && Array.isArray(data)) {
          for (const entry of data) {
            for (const p of entry.phonetics || []) {
              if (p.audio && typeof p.audio === 'string' && p.audio.trim()) {
                audioUrl = p.audio.trim();
                break;
              }
            }
            if (audioUrl) break;
          }
        }
        break; // success (even if no audio found)
      } catch (err) {
        if (err.message === 'RATE_LIMITED') {
          console.log(`  ⚠️  Rate limited — waiting 60 s...`);
          await sleep(60000);
        }
        retries++;
        if (retries > MAX_RETRIES) {
          console.log(`  ❌ ${word}: failed after ${MAX_RETRIES + 1} attempts`);
        }
      }
    }

    if (!audioUrl) {
      results.failed.push(norm);
      if ((i + 1) % 50 === 0 || i === allWords.length - 1) {
        process.stdout.write(`\r  📊 ${i + 1}/${allWords.length}  ✅${results.success.length} ❌${results.failed.length}`);
      }
      continue;
    }

    // ── Step 2: Download .mp3 ──
    const destPath = path.join(AUDIO_DIR, `${norm}.mp3`);
    try {
      await downloadFile(audioUrl, destPath);
      downloads++;
      results.success.push(norm);
      // Verify the file was written and is non-empty
      if (!DRY_RUN && (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0)) {
        throw new Error('Empty file');
      }
    } catch (err) {
      console.log(`  ⚠️  ${word}: download failed — ${err.message}`);
      results.failed.push(norm);
      // Clean up partial file
      try { fs.unlinkSync(destPath); } catch {}
    }

    // Progress
    if ((i + 1) % 50 === 0 || i === allWords.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      process.stdout.write(
        `\r  📊 ${i + 1}/${allWords.length}  ✅${results.success.length} ❌${results.failed.length}  ⏱ ${elapsed} min`,
      );
      if ((i + 1) % 50 === 0) process.stdout.write('\n');
    }
  }

  console.log('\n');

  // ── Generate manifest ──
  const successSet = new Set(results.success);
  const manifestLines = [
    '// Auto-generated by scripts/generate-audio.cjs — DO NOT EDIT',
    `// Generated: ${new Date().toISOString()}`,
    `// Words with real human audio: ${successSet.size} / ${allWords.length}`,
    '',
    '/** Set of words that have a pre-generated real-human MP3 at /audio/{word}.mp3 */',
    'export const CDN_AUDIO_WORDS = new Set([',
  ];

  const sorted = [...successSet].sort();
  for (const w of sorted) {
    manifestLines.push(`  '${w}',`);
  }
  manifestLines.push(']);');
  manifestLines.push('');

  if (!DRY_RUN) {
    fs.writeFileSync(MANIFEST_PATH, manifestLines.join('\n'), 'utf-8');
    console.log(`  ✅ Manifest written → src/data/audioManifest.ts`);
  }

  // ── Report ──
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('');
  console.log('═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Words processed:    ${allWords.length}`);
  console.log(`  Audio downloaded:   ${downloads} (new this run)`);
  console.log(`  From cache:         ${results.skipped.length}`);
  console.log(`  Total with audio:   ${successSet.size}`);
  console.log(`  No audio available: ${results.failed.length}`);
  console.log(`  API calls:          ${apiCalls}`);
  console.log(`  Elapsed:            ${elapsed} min`);
  console.log(`  Audio dir:          ${AUDIO_DIR}`);
  console.log(`  Manifest:           ${MANIFEST_PATH}`);
  console.log('═'.repeat(60));

  if (DRY_RUN) {
    console.log('\n  ⚠️  Dry run complete — run without --dry-run to actually download files.');
  }
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message || err);
  process.exit(1);
});
