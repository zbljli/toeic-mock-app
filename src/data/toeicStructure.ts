import { TestModeConfig, ToeicPart } from '../types';

/**
 * TOEIC Listening Test 结构
 *
 * Listening (45 min, 100 题):
 *   Part 1 - Photographs (6 题)
 *   Part 2 - Question-Response (25 题)
 *   Part 3 - Conversations (39 题)
 *   Part 4 - Talks (30 题)
 */

export interface PartInfo {
  part: ToeicPart;
  title: string;
  titleZh: string;
  type: 'listening';
  questionCount: number;
  description: string;
}

export const TOEIC_PARTS: PartInfo[] = [
  {
    part: 1,
    title: 'Photographs',
    titleZh: 'Photographs',
    type: 'listening',
    questionCount: 6,
    description: 'Listen to 4 statements and choose the one that best describes the photo.',
  },
  {
    part: 2,
    title: 'Question-Response',
    titleZh: 'Question-Response',
    type: 'listening',
    questionCount: 25,
    description: 'Listen to a question and choose the most appropriate response.',
  },
  {
    part: 3,
    title: 'Conversations',
    titleZh: 'Conversations',
    type: 'listening',
    questionCount: 39,
    description: 'Listen to a conversation and answer questions about it.',
  },
  {
    part: 4,
    title: 'Talks',
    titleZh: 'Talks',
    type: 'listening',
    questionCount: 30,
    description: 'Listen to a short talk and answer questions about it.',
  },
];

/** 听力模拟考试配置 */
export const LISTENING_TEST_CONFIG: TestModeConfig = {
  mode: 'listening-only',
  label: 'Full Listening Test',
  description: 'Part 1–4 · 45 min · 100 questions',
  totalQuestions: 100,
  totalTimeMinutes: 45,
  parts: [1, 2, 3, 4],
};

/** 生成 Part 练习模式（仅听力 Parts） */
export function getPartPracticeConfigs(): TestModeConfig[] {
  return TOEIC_PARTS.map((p) => ({
    mode: 'part-practice' as const,
    label: `Part ${p.part} - ${p.title}`,
    description: p.description,
    totalQuestions: p.questionCount,
    totalTimeMinutes: Math.ceil(p.questionCount * 0.75),
    parts: [p.part],
  }));
}
