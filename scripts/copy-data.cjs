/**
 * Post-build: copies runtime assets to dist/ so they can be
 * fetched at runtime instead of being bundled into the JS payload.
 *
 * Called after `npx expo export --platform web`.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// ── 1. Copy data JSON files ──────────────────────────────
{
  const srcDir = path.join(root, 'src', 'data');
  const destDir = path.join(root, 'dist', 'data');
  fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    const stat = fs.statSync(path.join(destDir, file));
    console.log(`  ✅ dist/data/${file}  (${(stat.size / 1024).toFixed(1)} KB)`);
  }
  console.log(`✅ Copied ${files.length} data files to dist/data/`);
}

// ── 2. Copy pre-generated audio files (real human) ────────
{
  const srcDir = path.join(root, 'web', 'audio');
  const destDir = path.join(root, 'dist', 'audio');

  if (!fs.existsSync(srcDir)) {
    console.log('ℹ️  No web/audio/ directory — skipping audio copy.');
    console.log('   Run `npm run generate-audio` to build the audio library.');
  } else {
    const audioFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith('.mp3'));
    if (audioFiles.length === 0) {
      console.log('ℹ️  web/audio/ is empty — skipping.');
    } else {
      fs.mkdirSync(destDir, { recursive: true });
      let totalSize = 0;
      for (const file of audioFiles) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
        totalSize += fs.statSync(path.join(destDir, file)).size;
      }
      console.log(`  ✅ dist/audio/  ${audioFiles.length} files  (${(totalSize / 1024 / 1024).toFixed(1)} MB)`);
      console.log(`✅ Copied ${audioFiles.length} audio files to dist/audio/`);
    }
  }
}

// ── 3. Copy pre-generated TTS audio files ─────────────────
{
  const srcDir = path.join(root, 'web', 'audio-tts');
  const destDir = path.join(root, 'dist', 'audio-tts');

  if (!fs.existsSync(srcDir)) {
    console.log('ℹ️  No web/audio-tts/ directory — skipping TTS audio copy.');
  } else {
    const ttsFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith('.mp3'));
    if (ttsFiles.length === 0) {
      console.log('ℹ️  web/audio-tts/ is empty — skipping.');
    } else {
      fs.mkdirSync(destDir, { recursive: true });
      let ttsSize = 0;
      for (const file of ttsFiles) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
        ttsSize += fs.statSync(path.join(destDir, file)).size;
      }
      console.log(`  ✅ dist/audio-tts/  ${ttsFiles.length} files  (${(ttsSize / 1024 / 1024).toFixed(1)} MB)`);
      console.log(`✅ Copied ${ttsFiles.length} TTS audio files to dist/audio-tts/`);
    }
  }
}
