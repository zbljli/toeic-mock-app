/**
 * Offline TTS audio generation — fills the gap for words without real human audio.
 *
 * Usage:  node scripts/generate-tts-audio.cjs [--dry-run] [--force]
 *
 * 1. Reads all words from src/data/words.json (1280 words).
 * 2. Cross-references audioManifest to find words WITHOUT CDN audio.
 * 3. Downloads Google Translate TTS .mp3 for each missing word.
 * 4. Saves to web/audio-tts/{word}.mp3.
 * 5. Appends CDN_TTS_WORDS Set to src/data/audioManifest.ts.
 *
 * Google TTS is free but rate-limited. We use ~1 req/s to stay safe.
 * Total time: ~9 minutes for ~514 words at 1 req/s.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Config ───────────────────────────────────────────────
const WORDS_PATH = path.join(__dirname, '..', 'src', 'data', 'words.json');
const AUDIO_DIR = path.join(__dirname, '..', 'web', 'audio-tts');
const MANIFEST_PATH = path.join(__dirname, '..', 'src', 'data', 'audioManifest.ts');

const REQUEST_INTERVAL_MS = 1200; // ~1.2 req/s — safe for Google TTS
const MAX_RETRIES = 2;
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

// ── Helpers ──────────────────────────────────────────────

/** Build Google Translate TTS URL. */
function googleTtsUrl(text) {
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;
}

/** Normalize a word for use as a filename. */
function normalizeFilename(word) {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

/** Download a file from `url` to `destPath`. */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (DRY_RUN) return resolve(true);
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { timeout: 20000 }, (res) => {
      // Google TTS may redirect to the actual audio server
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        res.resume();
        if (redirectUrl) return downloadFile(redirectUrl, destPath).then(resolve, reject);
      }
      if (res.statusCode === 429) {
        res.resume();
        return reject(new Error('RATE_LIMITED'));
      }
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

/** Delay helper. */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  TOEIC TTS Audio Supplement Pipeline');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log('  ⚠️  DRY RUN — no files will be written\n');

  // Load words.json
  const wordsData = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf-8'));
  const allWords = [...new Set(wordsData.map((w) => w.word.trim()))];
  console.log(`  📚 ${allWords.length} unique words in words.json`);

  // Parse existing audio manifest to find CDN_AUDIO_WORDS
  const manifestRaw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  const existing = new Set();
  const cdnMatches = manifestRaw.matchAll(/'([a-z][^']*)'/g);
  for (const m of cdnMatches) {
    existing.add(m[1].toLowerCase().trim());
  }
  console.log(`  🎵 ${existing.size} words already have CDN audio`);

  // Find missing words
  const missing = allWords.filter((w) => !existing.has(w.toLowerCase().trim()));
  console.log(`  ⚠️  ${missing.length} words need TTS audio\n`);

  if (missing.length === 0) {
    console.log('  ✅ All words already covered — nothing to do.\n');
    return;
  }

  // Ensure output directory exists
  if (!DRY_RUN) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  // Collect existing TTS files (for resume / skip)
  const existingTts = new Set();
  if (!FORCE && !DRY_RUN && fs.existsSync(AUDIO_DIR)) {
    for (const f of fs.readdirSync(AUDIO_DIR)) {
      if (f.endsWith('.mp3')) existingTts.add(f.replace('.mp3', ''));
    }
  }
  if (existingTts.size > 0) console.log(`  📁 ${existingTts.size} TTS files already exist (skipping)\n`);

  // ── Download ──
  const results = { success: [], failed: [], skipped: [] };
  let downloads = 0;
  const startTime = Date.now();

  for (let i = 0; i < missing.length; i++) {
    const word = missing[i];
    const norm = normalizeFilename(word);

    // Skip if already downloaded
    if (!FORCE && existingTts.has(norm)) {
      results.success.push(norm);
      results.skipped.push(norm);
      continue;
    }

    // Rate-limit pause (skip in dry-run)
    if (downloads > 0 && !DRY_RUN) await sleep(REQUEST_INTERVAL_MS);

    // Download with retries
    const destPath = path.join(AUDIO_DIR, `${norm}.mp3`);
    let ok = false;

    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        await downloadFile(googleTtsUrl(word), destPath);
        // Verify the file was written and is non-empty
        if (!DRY_RUN && (!fs.existsSync(destPath) || fs.statSync(destPath).size < 500)) {
          throw new Error('File too small (likely error response)');
        }
        ok = true;
        break;
      } catch (err) {
        if (err.message === 'RATE_LIMITED') {
          console.log(`\n  ⚠️  Rate limited — waiting 30s...`);
          await sleep(30000);
        }
        if (retry >= MAX_RETRIES) {
          console.log(`\n  ❌ ${word}: failed — ${err.message}`);
        }
      }
    }

    if (ok) {
      downloads++;
      results.success.push(norm);
    } else {
      results.failed.push(norm);
    }

    // Progress
    if ((i + 1) % 50 === 0 || i === missing.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      process.stdout.write(
        `\r  📊 ${i + 1}/${missing.length}  ✅${results.success.length} ❌${results.failed.length}  ⏱ ${elapsed} min`,
      );
      if ((i + 1) % 50 === 0) process.stdout.write('\n');
    }
  }

  console.log('\n');

  // ── Update manifest ──
  const ttsWords = results.success.map((n) => {
    // Reverse-map filename back to original word
    const w = wordsData.find((wd) => normalizeFilename(wd.word) === n);
    return w ? w.word.toLowerCase().trim() : n;
  });

  const ttsWordsSet = new Set(ttsWords.filter((w) => !existing.has(w)));

  // Read current manifest
  let manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf-8');

  // Remove any previous CDN_TTS_WORDS section
  manifestContent = manifestContent.replace(
    /\/\/ ── TTS supplement[\s\S]*$/,
    '',
  ).trim();

  // Append TTS words section
  const now = new Date().toISOString();
  const ttsSection = [
    '',
    '// ── TTS supplement (Google TTS, auto-generated) ──',
    `// Generated: ${now}`,
    `// Words with pre-generated TTS audio: ${ttsWordsSet.size} / ${missing.length} missing words`,
    '',
    '/** Set of words that have a pre-generated TTS MP3 at /audio-tts/{word}.mp3 */',
    'export const CDN_TTS_WORDS = new Set([',
    ...[...ttsWordsSet].sort().map((w) => `  '${w}',`),
    ']);',
    '',
  ].join('\n');

  if (!DRY_RUN) {
    fs.writeFileSync(MANIFEST_PATH, manifestContent + '\n' + ttsSection, 'utf-8');
    console.log(`  ✅ Manifest updated → src/data/audioManifest.ts (+${ttsWordsSet.size} TTS words)`);
  }

  // ── Report ──
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('');
  console.log('═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Words processed:         ${missing.length}`);
  console.log(`  TTS downloaded (new):    ${downloads}`);
  console.log(`  From cache:              ${results.skipped.length}`);
  console.log(`  Total TTS words:         ${ttsWordsSet.size}`);
  console.log(`  Still failed:            ${results.failed.length}`);
  console.log(`  Elapsed:                 ${elapsed} min`);
  console.log(`  Audio dir:               ${AUDIO_DIR}`);
  console.log(`  Manifest:                ${MANIFEST_PATH}`);
  console.log('═'.repeat(60));

  if (DRY_RUN) {
    console.log('\n  ⚠️  Dry run complete — run without --dry-run to actually download files.');
  }
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message || err);
  process.exit(1);
});
