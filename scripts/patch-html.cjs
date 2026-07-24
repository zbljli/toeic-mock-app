/**
 * Post-build script: patches dist/index.html with mobile-friendly
 * viewport meta, WeChat compatibility, and desktop phone-frame CSS.
 *
 * Called by: npx expo export --platform web && node scripts/patch-html.cjs
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

// ── Improve viewport meta ──
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no" />'
);

// ── Add mobile-web-app meta tags ──
html = html.replace(
  '<title>TOEIC 模拟考</title>',
  `<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="format-detection" content="telephone=no" />
<title>TOEIC Listening AI Coach</title>`
);

// ── Replace Expo reset CSS with mobile-first version ──
const OLD_STYLE = /<style id="expo-reset">[\s\S]*?<\/style>/;
const NEW_STYLE = `<style id="expo-reset">
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        height: 100%; margin: 0; padding: 0;
        -webkit-tap-highlight-color: transparent;
        -webkit-font-smoothing: antialiased;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      }
      body { overflow: hidden; }
      #root { display: flex; height: 100%; flex: 1; }

      /* Desktop: phone-frame */
      @media (min-width: 480px) {
        html { background: #1A1A2E; }
        body { display: flex; justify-content: center; align-items: center; background: #1A1A2E; }
        #root { max-width: 430px; width: 100%; height: 100%; background: #F5F7FA; box-shadow: 0 0 60px rgba(0,0,0,0.4); }
      }
      @media (min-width: 768px) {
        #root { border-radius: 24px; max-height: 93vh; }
      }

      #root:empty::after {
        content: ''; display: block; width: 32px; height: 32px;
        margin: calc(50vh - 16px) auto;
        border: 3px solid #E0E0E0; border-top-color: #1A237E;
        border-radius: 50%; animation: expo-spin 0.8s linear infinite;
      }
      @keyframes expo-spin { to { transform: rotate(360deg); } }
    </style>`;

html = html.replace(OLD_STYLE, NEW_STYLE);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Patched dist/index.html for mobile / WeChat compatibility');
