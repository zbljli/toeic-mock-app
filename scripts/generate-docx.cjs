/**
 * Generate Word document (.docx) from articles.json
 *
 * Usage:
 *   node scripts/generate-docx.cjs
 *
 * Output:
 *   TOEIC_场景学习全部文章.docx (in project root)
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, PageBreak, TableOfContents,
  Header, Footer, PageNumber, NumberFormat,
} = require('docx');

const ROOT = path.join(__dirname, '..');
const ARTICLES_PATH = path.join(ROOT, 'src', 'data', 'articles.json');
const SCENES_PATH = path.join(ROOT, 'src', 'data', 'scenes.json');
const OUTPUT_PATH = path.join(ROOT, 'TOEIC_场景学习全部文章.docx');

// ── Load data ──
const articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, 'utf-8'));
const scenes = JSON.parse(fs.readFileSync(SCENES_PATH, 'utf-8'));
const sceneMap = {};
scenes.forEach((s) => {
  sceneMap[s.id] = s;
});

// Group by scene
const byScene = {};
articles.forEach((a) => {
  if (!byScene[a.sceneId]) byScene[a.sceneId] = [];
  byScene[a.sceneId].push(a);
});

// ── Helpers ──

/** Split passage into paragraphs by double-newline or single newline */
function splitParagraphs(text) {
  // First try double newlines
  const blocks = text.split(/\n\n+/);
  const result = [];
  blocks.forEach((block) => {
    const lines = block.split(/\n/);
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) result.push(trimmed);
    });
  });
  return result;
}

/** Create a normal paragraph with optional bold lead-in */
function makeParagraph(text, options = {}) {
  const { bold, spacing, indent } = options;
  return new Paragraph({
    spacing: spacing || { after: 120, line: 320 },
    indent: indent || undefined,
    children: [
      new TextRun({
        text,
        size: 22, // ~11pt
        font: 'Calibri',
        bold: bold || false,
      }),
    ],
  });
}

/** Create article title (H3 equivalent) */
function makeArticleTitle(id, title, type, estimatedTime) {
  return new Paragraph({
    spacing: { before: 360, after: 200, line: 340 },
    children: [
      new TextRun({
        text: `[${id}] ${title}`,
        size: 26, // ~13pt
        font: 'Calibri',
        bold: true,
        color: '1A237E',
      }),
      new TextRun({
        text: `  · ${type === 'dialogue' ? '对话 Dialogue' : '文章 Article'} · ~${estimatedTime} min`,
        size: 20, // ~10pt
        font: 'Calibri',
        color: '757575',
      }),
    ],
  });
}

/** Horizontal rule using a thin border-bottom paragraph */
function makeDivider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC', space: 4 },
    },
    children: [],
  });
}

// ── Build Document Sections ──

const children = [];

// ═══ COVER / TITLE ═══
children.push(
  new Paragraph({
    spacing: { after: 0 },
    children: [],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, line: 380 },
    children: [
      new TextRun({
        text: 'TOEIC Coach',
        size: 56, // ~28pt
        font: 'Calibri',
        bold: true,
        color: '1A237E',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80, line: 360 },
    children: [
      new TextRun({
        text: '场景学习 · 全部文章',
        size: 40, // ~20pt
        font: 'Calibri',
        bold: true,
        color: '283593',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400, line: 340 },
    children: [
      new TextRun({
        text: `共 ${articles.length} 篇文章 · 24 个场景 · ${new Date().toISOString().slice(0, 10)} 导出`,
        size: 22,
        font: 'Calibri',
        color: '757575',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: '适用于播客音频批量生成',
        size: 22,
        font: 'Calibri',
        italics: true,
        color: '9E9E9E',
      }),
    ],
  })
);

// ═══ TABLE OF CONTENTS (simple manual version) ═══
children.push(
  new Paragraph({ spacing: { before: 400 }, children: [] }),
  new Paragraph({
    spacing: { after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '1A237E', space: 6 },
    },
    children: [
      new TextRun({
        text: '目录 Contents',
        size: 32,
        font: 'Calibri',
        bold: true,
        color: '1A237E',
      }),
    ],
  })
);

Object.entries(byScene).forEach(([sceneId, arts]) => {
  const scene = sceneMap[sceneId] || { name: sceneId, nameZh: '' };
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `${scene.icon || ''} ${scene.name}`,
          size: 22,
          font: 'Calibri',
          bold: true,
        }),
        new TextRun({
          text: `  ${scene.nameZh || ''}  — ${arts.length}篇`,
          size: 22,
          font: 'Calibri',
          color: '616161',
        }),
      ],
    })
  );
});

// ═══ PAGE BREAK before articles ═══
children.push(new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }));

// ═══ ARTICLES BY SCENE ═══
Object.entries(byScene).forEach(([sceneId, arts]) => {
  const scene = sceneMap[sceneId] || { name: sceneId, nameZh: '' };

  // Scene header
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 160, line: 360 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 3, color: '1976D2', space: 6 },
      },
      children: [
        new TextRun({
          text: `${scene.icon || ''} ${scene.name}`,
          size: 36, // ~18pt
          font: 'Calibri',
          bold: true,
          color: '1565C0',
        }),
        new TextRun({
          text: `  ${scene.nameZh || ''}  · ${arts.length} 篇`,
          size: 24, // ~12pt
          font: 'Calibri',
          color: '757575',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: scene.description || '',
          size: 20,
          font: 'Calibri',
          italics: true,
          color: '9E9E9E',
        }),
      ],
    })
  );

  // Each article
  arts.forEach((a, idx) => {
    children.push(makeArticleTitle(a.id, a.title, a.type, a.estimatedTime));

    // Passage paragraphs
    const passages = splitParagraphs(a.passage);
    passages.forEach((p) => {
      children.push(makeParagraph(p));
    });

    // Divider between articles (except last in scene)
    if (idx < arts.length - 1) {
      children.push(makeDivider());
    }
  });
});

// ═══ FOOTER STATS ═══
const totalWords = articles.reduce((s, a) => s + a.passage.split(/\s+/).length, 0);
const totalChars = articles.reduce((s, a) => s + a.passage.length, 0);
children.push(
  new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }),
  new Paragraph({
    spacing: { before: 400 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: 'BDBDBD', space: 8 },
    },
    children: [],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: `共 ${articles.length} 篇文章 · 总词数 ${totalWords.toLocaleString()} · 总字符 ${totalChars.toLocaleString()}`,
        size: 20,
        font: 'Calibri',
        color: '9E9E9E',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: `生成于 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}  |  TOEIC Coach App`,
        size: 18,
        font: 'Calibri',
        color: 'BDBDBD',
      }),
    ],
  })
);

// ── Create Document ──
const doc = new Document({
  creator: 'TOEIC Coach',
  title: 'TOEIC 场景学习全部文章',
  description: '场景学习全部文章导出，用于播客音频批量生成',
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22 },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // ~1 inch
          size: { width: 11906, height: 16838 }, // A4
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'TOEIC Coach · 场景学习全部文章',
                  size: 18,
                  font: 'Calibri',
                  color: 'BDBDBD',
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '— ',
                  size: 18,
                  font: 'Calibri',
                  color: 'BDBDBD',
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  font: 'Calibri',
                  color: 'BDBDBD',
                }),
                new TextRun({
                  text: ' —',
                  size: 18,
                  font: 'Calibri',
                  color: 'BDBDBD',
                }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

// ── Write ──
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  const sizeKB = (buffer.length / 1024).toFixed(0);
  console.log(`✅ Word document generated!`);
  console.log(`   📄 ${OUTPUT_PATH}`);
  console.log(`   📏 ${sizeKB} KB`);
  console.log(`   📊 ${articles.length} articles · ${Object.keys(byScene).length} scenes`);
  console.log(`   📝 ${totalWords.toLocaleString()} words total`);
}).catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
