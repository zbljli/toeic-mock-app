/**
 * Article audio pre-generation via Google TTS (gTTS).
 *
 * Usage:
 *   node scripts/generate-article-audio.cjs [--dry-run] [--force]
 *
 * Requirements:
 *   pip3 install gtts
 *
 * 1. Reads all articles from src/data/articles.json.
 * 2. Generates MP3 for each article via Google Translate TTS (gTTS Python lib).
 * 3. Saves to web/audio-articles/{article_id}.mp3.
 * 4. Updates articles.json with audio_url and estimated duration.
 *
 * gTTS handles text splitting internally (~200 char chunks per request)
 * and returns concatenated audio, so we don't need manual chunking.
 *
 * Rate: ~5-10 s per article (gTTS downloads ~10 sentence-chunks each).
 * Total: ~5-7 minutes for 41 articles.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Config ───────────────────────────────────────────────
const ROOT = path.join(__dirname, '..');
const ARTICLES_PATH = path.join(ROOT, 'src', 'data', 'articles.json');
const AUDIO_DIR = path.join(ROOT, 'web', 'audio-articles');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

// ── Helpers ──────────────────────────────────────────────

/**
 * Generate TTS audio via Python gTTS.
 * Writes text to a temp file to avoid shell-escaping nightmares.
 * Returns true on success.
 */
function generateTTS(text, outputPath) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would save → ${path.basename(outputPath)}`);
    return true;
  }

  const tmpTextFile = outputPath + '.txt';
  const tmpScriptFile = outputPath + '.py';

  try {
    // Write passage to temp text file (avoids quoting hell)
    fs.writeFileSync(tmpTextFile, text, 'utf-8');

    // Write Python helper script
    const pyScript = [
      'import sys, os',
      "from gtts import gTTS",
      '',
      `text_file = ${JSON.stringify(tmpTextFile)}`,
      `out_file = ${JSON.stringify(outputPath)}`,
      '',
      "with open(text_file, 'r', encoding='utf-8') as f:",
      '    text = f.read()',
      '',
      'text = text.strip()',
      'if not text:',
      "    print('EMPTY_TEXT')",
      '    sys.exit(1)',
      '',
      'tts = gTTS(text, lang="en", slow=False, lang_check=False)',
      'tts.save(out_file)',
      '',
      'size = os.path.getsize(out_file)',
      "print(f'OK {size}')",
    ].join('\n');
    fs.writeFileSync(tmpScriptFile, pyScript, 'utf-8');

    // Run
    const stdout = execSync(`python3 ${tmpScriptFile}`, {
      stdio: 'pipe',
      timeout: 180000, // 180 s timeout — long articles need ~15-20 gTTS chunks
      encoding: 'utf-8',
    }).trim();

    if (stdout.startsWith('OK')) {
      const fileSize = parseInt(stdout.split(' ')[1], 10);
      if (fileSize > 500) return true;
      console.error(`  ⚠️  Output file too small: ${fileSize} bytes`);
      return false;
    }

    console.error(`  ⚠️  Unexpected output: ${stdout}`);
    return false;
  } catch (err) {
    // Clean up possibly partial output
    try { fs.unlinkSync(outputPath); } catch {}
    throw err;
  } finally {
    try { fs.unlinkSync(tmpTextFile); } catch {}
    try { fs.unlinkSync(tmpScriptFile); } catch {}
  }
}

/**
 * Estimate MP3 duration in seconds from file size (bytes).
 * gTTS outputs ~64 kbps, 24 kHz CBR MP3.
 */
function estimateDuration(fileSizeBytes) {
  return Math.round((fileSizeBytes * 8) / 64000);
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  TOEIC Article Audio Generation (Google TTS)');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log('  ⚠️  DRY RUN — no files will be written\n');

  // Load articles
  if (!fs.existsSync(ARTICLES_PATH)) {
    console.error(`❌ Articles file not found: ${ARTICLES_PATH}`);
    process.exit(1);
  }
  const articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, 'utf-8'));
  console.log(`  📚 ${articles.length} articles loaded\n`);

  // Ensure output directory
  if (!DRY_RUN) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  // Stats
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const startTime = Date.now();
  const errors = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const audioFile = path.join(AUDIO_DIR, `${article.id}.mp3`);

    // ── Skip check ──
    const audioExists =
      !FORCE &&
      fs.existsSync(audioFile) &&
      fs.statSync(audioFile).size > 500 &&
      article.audio_url;

    if (audioExists) {
      skipped++;
      console.log(`  ⏭  [${i + 1}/${articles.length}] ${article.id} — already generated`);
      continue;
    }

    // ── Generate ──
    const passageLen = article.passage.length;
    console.log(`  🔊 [${i + 1}/${articles.length}] ${article.id} (${passageLen} chars) "${article.title.slice(0, 40)}..."`);

    let retries = 2;
    let ok = false;

    while (retries >= 0) {
      try {
        ok = generateTTS(article.passage, audioFile);
        if (ok) break;
        retries--;
      } catch (err) {
        retries--;
        if (retries >= 0) {
          const wait = (2 - retries) * 3000;
          console.log(`  ⚠️  Retrying in ${wait / 1000}s... (${err.message?.slice(0, 80)})`);
          await sleep(wait);
        }
      }
    }

    if (!ok) {
      failed++;
      errors.push(`${article.id}: all retries exhausted`);
      console.log(`  ❌ FAILED`);
      continue;
    }

    // ── Update article metadata ──
    if (!DRY_RUN) {
      const fileSize = fs.statSync(audioFile).size;
      const duration = estimateDuration(fileSize);
      article.audio_url = `/audio-articles/${article.id}.mp3`;
      article.duration = duration;
      generated++;
      console.log(`  ✅ ${(fileSize / 1024).toFixed(0)} KB  ⏱ ~${formatDuration(duration)}`);
    } else {
      article.audio_url = `/audio-articles/${article.id}.mp3`;
      article.duration = 0;
      generated++;
      console.log(`  ✅ (dry-run)`);
    }

    // Throttle: brief pause between articles
    if (!DRY_RUN && i < articles.length - 1) {
      await sleep(1000);
    }
  }

  // ── Write back articles.json ──
  if (!DRY_RUN && generated > 0) {
    fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2), 'utf-8');
    console.log(`\n✅ Updated articles.json (${generated} audio_url entries)`);
  }

  if (DRY_RUN) {
    console.log(`\n📊 DRY RUN — would generate ${articles.length - skipped} files`);
  }

  // ── Summary ──
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('');
  console.log('═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total articles:    ${articles.length}`);
  console.log(`  Generated (new):   ${generated}`);
  console.log(`  Skipped (cached):  ${skipped}`);
  console.log(`  Failed:            ${failed}`);
  console.log(`  Elapsed:           ${elapsed} min`);
  console.log(`  Audio dir:         web/audio-articles/`);
  console.log(`  Data file:         src/data/articles.json`);
  console.log('═'.repeat(60));

  if (errors.length > 0) {
    console.log(`\n⚠️  Failed articles:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  if (DRY_RUN) {
    console.log('\n  ⚠️  Dry run complete — run without --dry-run to actually generate audio.');
  } else {
    console.log('\n  Next step: npm run build:web');
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message || err);
  process.exit(1);
});
