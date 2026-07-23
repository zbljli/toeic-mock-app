import { Question, ToeicPart } from '../types';
import { TOEIC_PARTS } from './toeicStructure';

/**
 * 生成模拟题目
 *
 * 当前版本使用内置的示例题目数据。
 * 后续可以替换为：
 * - 从 JSON 文件加载题库
 * - 从 API 获取题目
 * - 接入 AI 生成题目
 */
export function generateQuestions(
  parts: ToeicPart[],
  targetCount: number,
): Question[] {
  // 获取各 Part 的实际题数
  const partCounts = new Map<ToeicPart, number>();
  for (const partInfo of TOEIC_PARTS) {
    if (parts.includes(partInfo.part)) {
      partCounts.set(partInfo.part, partInfo.questionCount);
    }
  }

  const questions: Question[] = [];

  for (const part of parts) {
    const count = partCounts.get(part) ?? 0;

    switch (part) {
      case 1:
        questions.push(...generatePart1(count));
        break;
      case 2:
        questions.push(...generatePart2(count));
        break;
      case 3:
        questions.push(...generatePart3(count));
        break;
      case 4:
        questions.push(...generatePart4(count));
        break;
      case 5:
        questions.push(...generatePart5(count));
        break;
      case 6:
        questions.push(...generatePart6(count));
        break;
      case 7:
        questions.push(...generatePart7(count));
        break;
    }
  }

  return questions.slice(0, targetCount);
}

// ===== Part 1: Photographs (6 题) =====
const PART1_IMAGES = [
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1577412647305-991150c7d5e3?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1436491865332-7a61a109bb05?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
];

function generatePart1(count: number): Question[] {
  const templates: Omit<Question, 'id'>[] = [
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
  return templates.slice(0, count).map((t, i) => ({ ...t, id: `p1-${i + 1}` }));
}

// ===== Part 2: Question-Response (25 题) =====
function generatePart2(count: number): Question[] {
  const questions: Question[] = [];
  const templates = [
    {
      prompt: 'Where is the nearest post office?',
      options: [
        { id: 'A', text: 'It opens at 9 a.m.' },
        { id: 'B', text: 'It\'s about two blocks from here.' },
        { id: 'C', text: 'I need to mail this package.' },
      ],
      correctOptionId: 'B',
    },
    {
      prompt: 'When will the report be ready?',
      options: [
        { id: 'A', text: 'By the end of this week.' },
        { id: 'B', text: 'It was a great report.' },
        { id: 'C', text: 'I\'ve already read it.' },
      ],
      correctOptionId: 'A',
    },
    {
      prompt: 'Would you prefer coffee or tea?',
      options: [
        { id: 'A', text: 'Yes, I would.' },
        { id: 'B', text: 'Coffee, please.' },
        { id: 'C', text: 'It\'s too hot.' },
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

  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    questions.push({
      ...t,
      id: `p2-${i + 1}`,
      part: 2,
      type: 'listening',
      transcript: `Q: ${t.prompt}  A: ${t.options.find(o => o.id === t.correctOptionId)?.text}`,
    });
  }
  return questions;
}

// ===== Part 3: Conversations =====
function generatePart3(count: number): Question[] {
  const questions: Question[] = [];
  const passages = [
    {
      passage: 'Man: Hello, I\'d like to make a reservation for dinner tonight.\nWoman: Certainly. How many people will be in your party?\nMan: There will be four of us. Do you have a table available at 7 p.m.?\nWoman: Let me check... Yes, we have a table at 7 p.m. May I have your name, please?',
      questions: [
        {
          prompt: 'How many people is the man reserving for?',
          options: [
            { id: 'A', text: 'Two' },
            { id: 'B', text: 'Three' },
            { id: 'C', text: 'Four' },
            { id: 'D', text: 'Five' },
          ],
          correctOptionId: 'C',
        },
        {
          prompt: 'What time does the man want the reservation?',
          options: [
            { id: 'A', text: '6 p.m.' },
            { id: 'B', text: '7 p.m.' },
            { id: 'C', text: '8 p.m.' },
            { id: 'D', text: '9 p.m.' },
          ],
          correctOptionId: 'B',
        },
        {
          prompt: 'What does the woman ask for at the end?',
          options: [
            { id: 'A', text: 'A phone number' },
            { id: 'B', text: 'A credit card' },
            { id: 'C', text: 'The man\'s name' },
            { id: 'D', text: 'The man\'s address' },
          ],
          correctOptionId: 'C',
        },
      ],
    },
    {
      passage: 'Woman: The marketing team meeting has been rescheduled.\nMan: Oh? When is it now?\nWoman: It\'s been moved from Tuesday to Thursday at 2 p.m.\nMan: Thursday at 2? That works better for me actually. Thanks for letting me know.',
      questions: [
        {
          prompt: 'What has been rescheduled?',
          options: [
            { id: 'A', text: 'A client call' },
            { id: 'B', text: 'A marketing team meeting' },
            { id: 'C', text: 'A training session' },
            { id: 'D', text: 'A job interview' },
          ],
          correctOptionId: 'B',
        },
        {
          prompt: 'When is the new meeting time?',
          options: [
            { id: 'A', text: 'Tuesday at 2 p.m.' },
            { id: 'B', text: 'Wednesday at 2 p.m.' },
            { id: 'C', text: 'Thursday at 2 p.m.' },
            { id: 'D', text: 'Friday at 2 p.m.' },
          ],
          correctOptionId: 'C',
        },
        {
          prompt: 'How does the man feel about the change?',
          options: [
            { id: 'A', text: 'Annoyed' },
            { id: 'B', text: 'Confused' },
            { id: 'C', text: 'Indifferent' },
            { id: 'D', text: 'Pleased' },
          ],
          correctOptionId: 'D',
        },
      ],
    },
  ];

  let qIdx = 0;
  for (let i = 0; i < count && qIdx < count; i++) {
    const p = passages[i % passages.length];
    for (const tq of p.questions) {
      if (qIdx >= count) break;
      questions.push({
        ...tq,
        id: `p3-${qIdx + 1}`,
        part: 3,
        type: 'listening',
        passage: p.passage,
        transcript: p.passage,
      });
      qIdx++;
    }
  }
  return questions;
}

// ===== Part 4: Talks =====
function generatePart4(count: number): Question[] {
  const questions: Question[] = [];
  const talks = [
    {
      passage: 'Attention passengers. Flight 847 to Chicago will begin boarding at Gate 23 in approximately 15 minutes. We ask that passengers in Group A please proceed to the gate area at this time. Passengers in Group B will be called shortly after. Thank you for your patience.',
      questions: [
        {
          prompt: 'What is the announcement about?',
          options: [
            { id: 'A', text: 'A flight delay' },
            { id: 'B', text: 'Boarding information' },
            { id: 'C', text: 'Baggage claim' },
            { id: 'D', text: 'Security procedures' },
          ],
          correctOptionId: 'B',
        },
        {
          prompt: 'Which gate is mentioned?',
          options: [
            { id: 'A', text: 'Gate 15' },
            { id: 'B', text: 'Gate 20' },
            { id: 'C', text: 'Gate 23' },
            { id: 'D', text: 'Gate 30' },
          ],
          correctOptionId: 'C',
        },
        {
          prompt: 'Which group should proceed to the gate now?',
          options: [
            { id: 'A', text: 'Group A' },
            { id: 'B', text: 'Group B' },
            { id: 'C', text: 'Group C' },
            { id: 'D', text: 'All groups' },
          ],
          correctOptionId: 'A',
        },
      ],
    },
    {
      passage: 'Good morning, everyone. I\'d like to welcome you to the annual sales conference. This year, we have a record number of attendees — over 500 from 12 countries. Our theme this year is "Innovation Through Collaboration." We have an exciting lineup of speakers, and I encourage you to network during the breaks.',
      questions: [
        {
          prompt: 'What type of event is this?',
          options: [
            { id: 'A', text: 'A training workshop' },
            { id: 'B', text: 'A sales conference' },
            { id: 'C', text: 'A product launch' },
            { id: 'D', text: 'A team building event' },
          ],
          correctOptionId: 'B',
        },
        {
          prompt: 'How many attendees are there?',
          options: [
            { id: 'A', text: 'Over 300' },
            { id: 'B', text: 'Over 400' },
            { id: 'C', text: 'Over 500' },
            { id: 'D', text: 'Over 600' },
          ],
          correctOptionId: 'C',
        },
        {
          prompt: 'What is the theme of the event?',
          options: [
            { id: 'A', text: 'Growing Together' },
            { id: 'B', text: 'Innovation Through Collaboration' },
            { id: 'C', text: 'Leading the Future' },
            { id: 'D', text: 'Excellence in Sales' },
          ],
          correctOptionId: 'B',
        },
      ],
    },
  ];

  let qIdx = 0;
  for (let i = 0; i < count && qIdx < count; i++) {
    const t = talks[i % talks.length];
    for (const tq of t.questions) {
      if (qIdx >= count) break;
      questions.push({
        ...tq,
        id: `p4-${qIdx + 1}`,
        part: 4,
        type: 'listening',
        passage: t.passage,
        transcript: t.passage,
      });
      qIdx++;
    }
  }
  return questions;
}

// ===== Part 5: Incomplete Sentences (30 题) =====
function generatePart5(count: number): Question[] {
  const templates: Omit<Question, 'id'>[] = [
    {
      part: 5,
      type: 'reading',
      prompt: 'The company\'s annual report will be ______ to all shareholders next week.',
      options: [
        { id: 'A', text: 'distribute' },
        { id: 'B', text: 'distributing' },
        { id: 'C', text: 'distributed' },
        { id: 'D', text: 'distribution' },
      ],
      correctOptionId: 'C',
    },
    {
      part: 5,
      type: 'reading',
      prompt: '______ of the employees attended the mandatory safety training.',
      options: [
        { id: 'A', text: 'Most' },
        { id: 'B', text: 'Much' },
        { id: 'C', text: 'Every' },
        { id: 'D', text: 'Little' },
      ],
      correctOptionId: 'A',
    },
    {
      part: 5,
      type: 'reading',
      prompt: 'The conference room is ______ the second floor, next to the cafeteria.',
      options: [
        { id: 'A', text: 'at' },
        { id: 'B', text: 'in' },
        { id: 'C', text: 'on' },
        { id: 'D', text: 'by' },
      ],
      correctOptionId: 'C',
    },
    {
      part: 5,
      type: 'reading',
      prompt: 'Please submit your expense reports ______ the end of the month.',
      options: [
        { id: 'A', text: 'until' },
        { id: 'B', text: 'by' },
        { id: 'C', text: 'during' },
        { id: 'D', text: 'since' },
      ],
      correctOptionId: 'B',
    },
    {
      part: 5,
      type: 'reading',
      prompt: 'The new software update includes several ______ improvements for users.',
      options: [
        { id: 'A', text: 'signify' },
        { id: 'B', text: 'significant' },
        { id: 'C', text: 'significantly' },
        { id: 'D', text: 'significance' },
      ],
      correctOptionId: 'B',
    },
    {
      part: 5,
      type: 'reading',
      prompt: 'Neither the manager nor the team members ______ available for the call yesterday.',
      options: [
        { id: 'A', text: 'was' },
        { id: 'B', text: 'were' },
        { id: 'C', text: 'has' },
        { id: 'D', text: 'have' },
      ],
      correctOptionId: 'B',
    },
    {
      part: 5,
      type: 'reading',
      prompt: 'The factory has increased production ______ 15% since implementing the new system.',
      options: [
        { id: 'A', text: 'by' },
        { id: 'B', text: 'at' },
        { id: 'C', text: 'to' },
        { id: 'D', text: 'with' },
      ],
      correctOptionId: 'A',
    },
    {
      part: 5,
      type: 'reading',
      prompt: 'Ms. Tanaka is the person ______ we interviewed for the position last week.',
      options: [
        { id: 'A', text: 'which' },
        { id: 'B', text: 'what' },
        { id: 'C', text: 'whom' },
        { id: 'D', text: 'whose' },
      ],
      correctOptionId: 'C',
    },
    {
      part: 5,
      type: 'reading',
      prompt: 'The project was completed ahead ______ schedule and under budget.',
      options: [
        { id: 'A', text: 'of' },
        { id: 'B', text: 'from' },
        { id: 'C', text: 'than' },
        { id: 'D', text: 'with' },
      ],
      correctOptionId: 'A',
    },
    {
      part: 5,
      type: 'reading',
      prompt: 'We recommend ______ your reservation at least 24 hours in advance.',
      options: [
        { id: 'A', text: 'confirm' },
        { id: 'B', text: 'to confirm' },
        { id: 'C', text: 'confirming' },
        { id: 'D', text: 'confirmed' },
      ],
      correctOptionId: 'C',
    },
  ];

  return templates.slice(0, count).map((t, i) => ({ ...t, id: `p5-${i + 1}` }));
}

// ===== Part 6: Text Completion (16 题) =====
function generatePart6(count: number): Question[] {
  const questions: Question[] = [];

  const passage = `Dear Mr. Peterson,

Thank you for your interest in our consulting services. We have reviewed your request and would like to schedule an initial consultation to discuss your company's needs (1)______ detail.

Our senior consultant, Dr. Sarah Lee, will be (2)______ for your account. She has over 15 years of experience in your industry and has successfully (3)______ similar projects in the past.

Please let us know your availability next week, and we will (4)______ the meeting accordingly.`;

  const qs: Omit<Question, 'id'>[] = [
    {
      part: 6,
      type: 'reading',
      prompt: 'Blank (1)',
      passage,
      options: [
        { id: 'A', text: 'at' },
        { id: 'B', text: 'in' },
        { id: 'C', text: 'on' },
        { id: 'D', text: 'for' },
      ],
      correctOptionId: 'B',
    },
    {
      part: 6,
      type: 'reading',
      prompt: 'Blank (2)',
      passage,
      options: [
        { id: 'A', text: 'responsible' },
        { id: 'B', text: 'responsibly' },
        { id: 'C', text: 'responsibility' },
        { id: 'D', text: 'responsive' },
      ],
      correctOptionId: 'A',
    },
    {
      part: 6,
      type: 'reading',
      prompt: 'Blank (3)',
      passage,
      options: [
        { id: 'A', text: 'completed' },
        { id: 'B', text: 'competed' },
        { id: 'C', text: 'compiled' },
        { id: 'D', text: 'complied' },
      ],
      correctOptionId: 'A',
    },
    {
      part: 6,
      type: 'reading',
      prompt: 'Blank (4)',
      passage,
      options: [
        { id: 'A', text: 'arrange' },
        { id: 'B', text: 'arranges' },
        { id: 'C', text: 'arranged' },
        { id: 'D', text: 'arrangement' },
      ],
      correctOptionId: 'A',
    },
  ];

  return qs.slice(0, count).map((t, i) => ({ ...t, id: `p6-${i + 1}` }));
}

// ===== Part 7: Reading Comprehension (54 题) =====
function generatePart7(count: number): Question[] {
  const questions: Question[] = [];

  const article = `MEMORANDUM

To: All Staff
From: Human Resources Department
Date: March 15, 2026
Subject: New Remote Work Policy

Effective April 1, 2026, the company will implement a new remote work policy. Employees may work from home up to two days per week, provided that their manager approves the arrangement in advance. All remote work requests must be submitted through the company portal by Thursday of the previous week.

Employees working remotely are expected to be available during core business hours (10 a.m. to 4 p.m.) and must attend all scheduled meetings, either in person or via video conference. Equipment such as laptops and monitors will be provided by the company upon request.`;

  const qs: Omit<Question, 'id'>[] = [
    {
      part: 7,
      type: 'reading',
      prompt: 'When does the new policy take effect?',
      passage: article,
      options: [
        { id: 'A', text: 'March 15, 2026' },
        { id: 'B', text: 'April 1, 2026' },
        { id: 'C', text: 'May 1, 2026' },
        { id: 'D', text: 'Immediately' },
      ],
      correctOptionId: 'B',
    },
    {
      part: 7,
      type: 'reading',
      prompt: 'How many days per week can employees work from home?',
      passage: article,
      options: [
        { id: 'A', text: 'One day' },
        { id: 'B', text: 'Up to two days' },
        { id: 'C', text: 'Three days' },
        { id: 'D', text: 'Every day' },
      ],
      correctOptionId: 'B',
    },
    {
      part: 7,
      type: 'reading',
      prompt: 'What must employees do to work remotely?',
      passage: article,
      options: [
        { id: 'A', text: 'Send an email to HR' },
        { id: 'B', text: 'Call their manager' },
        { id: 'C', text: 'Submit a request through the portal' },
        { id: 'D', text: 'Fill out a paper form' },
      ],
      correctOptionId: 'C',
    },
    {
      part: 7,
      type: 'reading',
      prompt: 'What are the core business hours mentioned?',
      passage: article,
      options: [
        { id: 'A', text: '9 a.m. to 5 p.m.' },
        { id: 'B', text: '10 a.m. to 4 p.m.' },
        { id: 'C', text: '8 a.m. to 6 p.m.' },
        { id: 'D', text: '10 a.m. to 6 p.m.' },
      ],
      correctOptionId: 'B',
    },
    {
      part: 7,
      type: 'reading',
      prompt: 'What is true about equipment?',
      passage: article,
      options: [
        { id: 'A', text: 'Employees must buy their own' },
        { id: 'B', text: 'Equipment is provided on request' },
        { id: 'C', text: 'Only laptops are provided' },
        { id: 'D', text: 'No equipment is mentioned' },
      ],
      correctOptionId: 'B',
    },
  ];

  return qs.slice(0, count).map((t, i) => ({ ...t, id: `p7-${i + 1}` }));
}
