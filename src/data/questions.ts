import { Question, ToeicPart, AudioScript, AudioSegment, SpeakerProfile } from '../types';
import { TOEIC_PARTS } from './toeicStructure';

/**
 * 生成模拟题目 — 按 TOEIC 各 Part 实际比例分配题目数量
 *
 * TOEIC Listening 标准分布 (100 题):
 *   Part 1: 6   Part 2: 25   Part 3: 39   Part 4: 30
 *
 * 当 targetCount 不等于 100 时，按比例缩放各 Part 的题目数。
 */
export function generateQuestions(
  parts: ToeicPart[],
  targetCount: number,
): Question[] {
  // 计算所选 Parts 的标准 TOEIC 题数
  let standardTotal = 0;
  const standardCounts = new Map<ToeicPart, number>();
  for (const partInfo of TOEIC_PARTS) {
    if (parts.includes(partInfo.part)) {
      standardCounts.set(partInfo.part, partInfo.questionCount);
      standardTotal += partInfo.questionCount;
    }
  }

  // 按 targetCount 等比例缩放每个 Part
  const scaledCounts = new Map<ToeicPart, number>();
  let allocated = 0;
  const partList: ToeicPart[] = [];
  for (const part of parts) {
    const std = standardCounts.get(part) ?? 0;
    const scaled = Math.round((std / standardTotal) * targetCount);
    scaledCounts.set(part, Math.max(scaled, parts.length === 1 ? targetCount : 1));
    allocated += scaledCounts.get(part) ?? 0;
    partList.push(part);
  }

  // 修正四舍五入导致的误差, 加到最后一个 Part
  if (partList.length > 0) {
    const diff = targetCount - allocated;
    const lastPart = partList[partList.length - 1];
    scaledCounts.set(lastPart, (scaledCounts.get(lastPart) ?? 0) + diff);
  }

  // 按分配的数量生成题目
  const questions: Question[] = [];
  for (const part of parts) {
    const count = scaledCounts.get(part) ?? 0;
    if (count <= 0) continue;
    switch (part) {
      case 1: questions.push(...generatePart1(count)); break;
      case 2: questions.push(...generatePart2(count)); break;
      case 3: questions.push(...generatePart3(count)); break;
      case 4: questions.push(...generatePart4(count)); break;
    }
  }

  return questions;
}

// ══════════════════════════════════════════════
//  Audio Script 构建辅助函数
// ══════════════════════════════════════════════

/** 通用 speaker 模板 */
const SPEAKERS = {
  announcer: { id: 'announcer', gender: 'male' as const, voiceStyle: '广播员' },
  announcerF: { id: 'announcer_f', gender: 'female' as const, voiceStyle: '广播员' },
  maleBiz: { id: 'male_biz', gender: 'male' as const, voiceStyle: '商务男性' },
  femaleBiz: { id: 'female_biz', gender: 'female' as const, voiceStyle: '商务女性' },
};

function makeScript(
  scenario: string,
  speakers: SpeakerProfile[],
  segments: AudioSegment[],
): AudioScript {
  return { scenario, speakers, segments };
}

/** 按句号/问号/感叹号拆分长文本 */
function splitSentences(text: string): string[] {
  const result: string[] = [];
  // Split on sentence boundaries while keeping delimiter
  const parts = text.split(/(?<=[.!?])\s+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) result.push(trimmed);
  }
  return result;
}

/** 从 transcript 中提取选项文本，去除 (A)/(B)/(C)/(D) 标签 */
function parseOptionStatements(transcript: string): string[] {
  const statements: string[] = [];
  const matches = transcript.matchAll(/\(([A-D])\)\s*([^(]+?)(?=\s*\([A-D]\)|\s*$)/g);
  for (const m of matches) {
    statements.push(m[2].trim());
  }
  if (statements.length === 0) {
    // fallback: just return the whole text as one
    return [transcript.replace(/\s*\([A-D]\)\s*/g, ' ').trim()];
  }
  return statements;
}

/** 解析对话文本中的 Man:/Woman: 角色 */
function parseDialogueScript(
  passage: string,
): { speakerId: string; text: string }[] {
  const lines: { speakerId: string; text: string }[] = [];
  const roleRegex = /(?:^|\n)\s*(Man\s*(?:\d+)?|Woman\s*(?:\d+)?|M|W)\s*:\s*/gi;

  const parts = passage.split(roleRegex);
  const initial = parts[0]?.trim();
  if (initial) {
    lines.push({ speakerId: 'male_biz', text: initial });
  }

  for (let i = 1; i < parts.length; i += 2) {
    const roleMarker = (parts[i] ?? '').trim();
    const text = (parts[i + 1] ?? '').trim();
    if (!text) continue;
    const isMale = /^man\b|^m\b/i.test(roleMarker);
    lines.push({
      speakerId: isMale ? 'male_biz' : 'female_biz',
      text,
    });
  }

  return lines;
}

// ══════════════════════════════════════════════
//  Part 1: Photographs
//  单人描述，选项间自然停顿
// ══════════════════════════════════════════════
const PART1_IMAGES = [
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1577412647305-991150c7d5e3?w=800&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1436491865332-7a61a109bb05?w=800&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop&q=80',
];

const PART1_TEMPLATES: Omit<Question, 'id'>[] = [
  {
    part: 1,
    type: 'listening',
    prompt: 'Look at the picture and listen to the four statements. Which statement best describes the picture?',
    imageUrl: PART1_IMAGES[0],
    options: [
      { id: 'A', text: 'A man is reading a book at his desk.' },
      { id: 'B', text: 'A man is writing on a whiteboard.' },
      { id: 'C', text: 'A man is talking on the phone.' },
      { id: 'D', text: 'A man is typing on a computer.' },
    ],
    correctOptionId: 'D',
    transcript: '(A) A man is reading a book at his desk. (B) A man is writing on a whiteboard. (C) A man is talking on the phone. (D) A man is typing on a computer.',
  },
  {
    part: 1,
    type: 'listening',
    prompt: 'Look at the picture and listen to the four statements. Which statement best describes the picture?',
    imageUrl: PART1_IMAGES[1],
    options: [
      { id: 'A', text: 'The customers are waiting in line.' },
      { id: 'B', text: 'The shelves are being restocked.' },
      { id: 'C', text: 'A woman is pushing a shopping cart.' },
      { id: 'D', text: 'The store is closed for the day.' },
    ],
    correctOptionId: 'C',
    transcript: '(A) The customers are waiting in line. (B) The shelves are being restocked. (C) A woman is pushing a shopping cart. (D) The store is closed for the day.',
  },
  {
    part: 1,
    type: 'listening',
    prompt: 'Look at the picture and listen to the four statements. Which statement best describes the picture?',
    imageUrl: PART1_IMAGES[2],
    options: [
      { id: 'A', text: 'The meeting room is empty.' },
      { id: 'B', text: 'People are seated around a conference table.' },
      { id: 'C', text: 'Someone is giving a presentation.' },
      { id: 'D', text: 'The chairs are being arranged.' },
    ],
    correctOptionId: 'B',
    transcript: '(A) The meeting room is empty. (B) People are seated around a conference table. (C) Someone is giving a presentation. (D) The chairs are being arranged.',
  },
  {
    part: 1,
    type: 'listening',
    prompt: 'Look at the picture and listen to the four statements. Which statement best describes the picture?',
    imageUrl: PART1_IMAGES[3],
    options: [
      { id: 'A', text: 'A boat is docked at the pier.' },
      { id: 'B', text: 'People are swimming in the water.' },
      { id: 'C', text: 'The bridge is under construction.' },
      { id: 'D', text: 'Cars are crossing the bridge.' },
    ],
    correctOptionId: 'D',
    transcript: '(A) A boat is docked at the pier. (B) People are swimming in the water. (C) The bridge is under construction. (D) Cars are crossing the bridge.',
  },
  {
    part: 1,
    type: 'listening',
    prompt: 'Look at the picture and listen to the four statements. Which statement best describes the picture?',
    imageUrl: PART1_IMAGES[4],
    options: [
      { id: 'A', text: 'The passengers are boarding the plane.' },
      { id: 'B', text: 'The plane is taking off.' },
      { id: 'C', text: 'The luggage is being loaded.' },
      { id: 'D', text: 'The pilot is checking the instruments.' },
    ],
    correctOptionId: 'A',
    transcript: '(A) The passengers are boarding the plane. (B) The plane is taking off. (C) The luggage is being loaded. (D) The pilot is checking the instruments.',
  },
  {
    part: 1,
    type: 'listening',
    prompt: 'Look at the picture and listen to the four statements. Which statement best describes the picture?',
    imageUrl: PART1_IMAGES[5],
    options: [
      { id: 'A', text: 'The waiter is taking an order.' },
      { id: 'B', text: 'The diners are looking at the menu.' },
      { id: 'C', text: 'The chef is preparing a dish.' },
      { id: 'D', text: 'The table has been cleared.' },
    ],
    correctOptionId: 'B',
    transcript: '(A) The waiter is taking an order. (B) The diners are looking at the menu. (C) The chef is preparing a dish. (D) The table has been cleared.',
  },
];

function generatePart1(count: number): Question[] {
  return PART1_TEMPLATES.slice(0, count).map((t, i) => {
    const statements = parseOptionStatements(t.transcript!);
    const segments: AudioSegment[] = statements.map((text, si) => ({
      speakerId: 'announcer',
      text,
      pauseBefore: si === 0 ? 0 : 0.6,
    }));

    return {
      ...t,
      id: `p1-${i + 1}`,
      audioScript: makeScript('office', [SPEAKERS.announcer], segments),
    };
  });
}

// ══════════════════════════════════════════════
//  Part 2: Question-Response
//  提问者(男) + 回答者(女)，问-答自然停顿
// ══════════════════════════════════════════════
const PART2_TEMPLATES = [
  {
    prompt: 'Where is the nearest post office?',
    options: [
      { id: 'A', text: 'It opens at 9 a.m.' },
      { id: 'B', text: "It's about two blocks from here." },
      { id: 'C', text: 'I need to mail this package.' },
    ],
    correctOptionId: 'B',
  },
  {
    prompt: 'When will the report be ready?',
    options: [
      { id: 'A', text: 'By the end of this week.' },
      { id: 'B', text: 'It was a great report.' },
      { id: 'C', text: "I've already read it." },
    ],
    correctOptionId: 'A',
  },
  {
    prompt: 'Would you prefer coffee or tea?',
    options: [
      { id: 'A', text: 'Yes, I would.' },
      { id: 'B', text: 'Coffee, please.' },
      { id: 'C', text: "It's too hot." },
    ],
    correctOptionId: 'B',
  },
  {
    prompt: 'Who is in charge of this project?',
    options: [
      { id: 'A', text: 'It started last month.' },
      { id: 'B', text: 'Ms. Johnson is the project manager.' },
      { id: 'C', text: 'The project was a success.' },
    ],
    correctOptionId: 'B',
  },
  {
    prompt: 'How many people attended the conference?',
    options: [
      { id: 'A', text: 'It was very informative.' },
      { id: 'B', text: 'The conference room is on the second floor.' },
      { id: 'C', text: 'Around two hundred, I believe.' },
    ],
    correctOptionId: 'C',
  },
];

function generatePart2(count: number): Question[] {
  const questions: Question[] = [];
  const speakers: SpeakerProfile[] = [
    { id: 'questioner', gender: 'male', voiceStyle: '提问者' },
    { id: 'responder', gender: 'female', voiceStyle: '回答者' },
  ];

  for (let i = 0; i < count; i++) {
    const t = PART2_TEMPLATES[i % PART2_TEMPLATES.length];
    const answerText = t.options.find(o => o.id === t.correctOptionId)?.text ?? '';
    const segments: AudioSegment[] = [
      { speakerId: 'questioner', text: t.prompt, pauseBefore: 0 },
      { speakerId: 'responder', text: answerText, pauseBefore: 0.5 },
    ];

    questions.push({
      ...t,
      id: `p2-${i + 1}`,
      part: 2,
      type: 'listening',
      transcript: `Q: ${t.prompt}  A: ${answerText}`,
      audioScript: makeScript('office', speakers, segments),
    });
  }
  return questions;
}

// ══════════════════════════════════════════════
//  Part 3: Conversations
//  男女对话，角色声音区分，切换自然停顿
// ══════════════════════════════════════════════
const PART3_PASSAGES = [
  {
    scenario: 'restaurant',
    passage: "Man: Hello, I'd like to make a reservation for dinner tonight.\nWoman: Certainly. How many people will be in your party?\nMan: There will be four of us. Do you have a table available at 7 p.m.?\nWoman: Let me check... Yes, we have a table at 7 p.m. May I have your name, please?",
    questions: [
      {
        prompt: 'How many people is the man reserving for?',
        options: [
          { id: 'A', text: 'Two' }, { id: 'B', text: 'Three' },
          { id: 'C', text: 'Four' }, { id: 'D', text: 'Five' },
        ],
        correctOptionId: 'C',
      },
      {
        prompt: 'What time does the man want the reservation?',
        options: [
          { id: 'A', text: '6 p.m.' }, { id: 'B', text: '7 p.m.' },
          { id: 'C', text: '8 p.m.' }, { id: 'D', text: '9 p.m.' },
        ],
        correctOptionId: 'B',
      },
      {
        prompt: 'What does the woman ask for at the end?',
        options: [
          { id: 'A', text: 'A phone number' }, { id: 'B', text: 'A credit card' },
          { id: 'C', text: "The man's name" }, { id: 'D', text: "The man's address" },
        ],
        correctOptionId: 'C',
      },
    ],
  },
  {
    scenario: 'meeting',
    passage: "Woman: The marketing team meeting has been rescheduled.\nMan: Oh? When is it now?\nWoman: It's been moved from Tuesday to Thursday at 2 p.m.\nMan: Thursday at 2? That works better for me actually. Thanks for letting me know.",
    questions: [
      {
        prompt: 'What has been rescheduled?',
        options: [
          { id: 'A', text: 'A client call' }, { id: 'B', text: 'A marketing team meeting' },
          { id: 'C', text: 'A training session' }, { id: 'D', text: 'A job interview' },
        ],
        correctOptionId: 'B',
      },
      {
        prompt: 'When is the new meeting time?',
        options: [
          { id: 'A', text: 'Tuesday at 2 p.m.' }, { id: 'B', text: 'Wednesday at 2 p.m.' },
          { id: 'C', text: 'Thursday at 2 p.m.' }, { id: 'D', text: 'Friday at 2 p.m.' },
        ],
        correctOptionId: 'C',
      },
      {
        prompt: 'How does the man feel about the change?',
        options: [
          { id: 'A', text: 'Annoyed' }, { id: 'B', text: 'Confused' },
          { id: 'C', text: 'Indifferent' }, { id: 'D', text: 'Pleased' },
        ],
        correctOptionId: 'D',
      },
    ],
  },
];

function generatePart3(count: number): Question[] {
  const questions: Question[] = [];
  const speakers: SpeakerProfile[] = [SPEAKERS.maleBiz, SPEAKERS.femaleBiz];
  let qIdx = 0;

  for (let i = 0; i < count && qIdx < count; i++) {
    const p = PART3_PASSAGES[i % PART3_PASSAGES.length];
    const dialogueLines = parseDialogueScript(p.passage);
    const segments: AudioSegment[] = dialogueLines.map((line, li) => {
      const prevSpeaker = li > 0 ? dialogueLines[li - 1].speakerId : null;
      const pause = prevSpeaker && prevSpeaker !== line.speakerId ? 0.4 : 0.2;
      return { speakerId: line.speakerId, text: line.text, pauseBefore: pause };
    });
    const audioScript = makeScript(p.scenario, speakers, segments);

    for (const tq of p.questions) {
      if (qIdx >= count) break;
      questions.push({
        ...tq,
        id: `p3-${qIdx + 1}`,
        part: 3,
        type: 'listening',
        passage: p.passage,
        transcript: p.passage,
        audioScript,
      });
      qIdx++;
    }
  }
  return questions;
}

// ══════════════════════════════════════════════
//  Part 4: Talks
//  单人广播/公告，句间自然停顿，沉稳语速
// ══════════════════════════════════════════════
const PART4_TALKS = [
  {
    scenario: 'airport',
    passage: 'Attention passengers. Flight 847 to Chicago will begin boarding at Gate 23 in approximately 15 minutes. We ask that passengers in Group A please proceed to the gate area at this time. Passengers in Group B will be called shortly after. Thank you for your patience.',
    questions: [
      {
        prompt: 'What is the announcement about?',
        options: [
          { id: 'A', text: 'A flight delay' }, { id: 'B', text: 'Boarding information' },
          { id: 'C', text: 'Baggage claim' }, { id: 'D', text: 'Security procedures' },
        ],
        correctOptionId: 'B',
      },
      {
        prompt: 'Which gate is mentioned?',
        options: [
          { id: 'A', text: 'Gate 15' }, { id: 'B', text: 'Gate 20' },
          { id: 'C', text: 'Gate 23' }, { id: 'D', text: 'Gate 30' },
        ],
        correctOptionId: 'C',
      },
      {
        prompt: 'Which group should proceed to the gate now?',
        options: [
          { id: 'A', text: 'Group A' }, { id: 'B', text: 'Group B' },
          { id: 'C', text: 'Group C' }, { id: 'D', text: 'All groups' },
        ],
        correctOptionId: 'A',
      },
    ],
  },
  {
    scenario: 'meeting',
    passage: 'Good morning, everyone. I\'d like to welcome you to the annual sales conference. This year, we have a record number of attendees — over 500 from 12 countries. Our theme this year is "Innovation Through Collaboration." We have an exciting lineup of speakers, and I encourage you to network during the breaks.',
    questions: [
      {
        prompt: 'What type of event is this?',
        options: [
          { id: 'A', text: 'A training workshop' }, { id: 'B', text: 'A sales conference' },
          { id: 'C', text: 'A product launch' }, { id: 'D', text: 'A team building event' },
        ],
        correctOptionId: 'B',
      },
      {
        prompt: 'How many attendees are there?',
        options: [
          { id: 'A', text: 'Over 300' }, { id: 'B', text: 'Over 400' },
          { id: 'C', text: 'Over 500' }, { id: 'D', text: 'Over 600' },
        ],
        correctOptionId: 'C',
      },
      {
        prompt: 'What is the theme of the event?',
        options: [
          { id: 'A', text: 'Growing Together' }, { id: 'B', text: 'Innovation Through Collaboration' },
          { id: 'C', text: 'Leading the Future' }, { id: 'D', text: 'Excellence in Sales' },
        ],
        correctOptionId: 'B',
      },
    ],
  },
];

function generatePart4(count: number): Question[] {
  const questions: Question[] = [];
  let qIdx = 0;

  for (let i = 0; i < count && qIdx < count; i++) {
    const t = PART4_TALKS[i % PART4_TALKS.length];
    const sentences = splitSentences(t.passage);
    const segments: AudioSegment[] = sentences.map((text, si) => ({
      speakerId: 'announcer_f',
      text,
      pauseBefore: si === 0 ? 0 : 1.0,
      rate: 0.88, // Part 4 沉稳语速
    }));
    const audioScript = makeScript(t.scenario, [SPEAKERS.announcerF], segments);

    for (const tq of t.questions) {
      if (qIdx >= count) break;
      questions.push({
        ...tq,
        id: `p4-${qIdx + 1}`,
        part: 4,
        type: 'listening',
        passage: t.passage,
        transcript: t.passage,
        audioScript,
      });
      qIdx++;
    }
  }
  return questions;
}
