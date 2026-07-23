import { TestModeConfig, ToeicPart } from '../types';

/**
 * TOEIC Listening & Reading Test 结构
 *
 * Listening (45 min, 100 题):
 *   Part 1 - Photographs (6 题)
 *   Part 2 - Question-Response (25 题)
 *   Part 3 - Conversations (39 题)
 *   Part 4 - Talks (30 题)
 *
 * Reading (75 min, 100 题):
 *   Part 5 - Incomplete Sentences (30 题)
 *   Part 6 - Text Completion (16 题)
 *   Part 7 - Reading Comprehension (54 题)
 */

export interface PartInfo {
  part: ToeicPart;
  title: string;
  titleZh: string;
  type: 'listening' | 'reading';
  questionCount: number;
  description: string;
}

export const TOEIC_PARTS: PartInfo[] = [
  {
    part: 1,
    title: 'Photographs',
    titleZh: '照片描述',
    type: 'listening',
    questionCount: 6,
    description: '听录音，选择最符合图片的描述',
  },
  {
    part: 2,
    title: 'Question-Response',
    titleZh: '应答问题',
    type: 'listening',
    questionCount: 25,
    description: '听问题，选择最合适的回答',
  },
  {
    part: 3,
    title: 'Conversations',
    titleZh: '简短对话',
    type: 'listening',
    questionCount: 39,
    description: '听对话，回答相关问题',
  },
  {
    part: 4,
    title: 'Talks',
    titleZh: '简短独白',
    type: 'listening',
    questionCount: 30,
    description: '听独白，回答相关问题',
  },
  {
    part: 5,
    title: 'Incomplete Sentences',
    titleZh: '句子填空',
    type: 'reading',
    questionCount: 30,
    description: '选择正确的单词或短语完成句子',
  },
  {
    part: 6,
    title: 'Text Completion',
    titleZh: '段落填空',
    type: 'reading',
    questionCount: 16,
    description: '选择正确的单词或短语完成段落',
  },
  {
    part: 7,
    title: 'Reading Comprehension',
    titleZh: '阅读理解',
    type: 'reading',
    questionCount: 54,
    description: '阅读文章或图表，回答相关问题',
  },
];

export const TEST_MODES: TestModeConfig[] = [
  {
    mode: 'full',
    label: '完整模考',
    description: '听力 45 分钟 + 阅读 75 分钟，共 200 题',
    totalQuestions: 200,
    totalTimeMinutes: 120,
    parts: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    mode: 'listening-only',
    label: '听力专项',
    description: '听力 45 分钟，100 题',
    totalQuestions: 100,
    totalTimeMinutes: 45,
    parts: [1, 2, 3, 4],
  },
  {
    mode: 'reading-only',
    label: '阅读专项',
    description: '阅读 75 分钟，100 题',
    totalQuestions: 100,
    totalTimeMinutes: 75,
    parts: [5, 6, 7],
  },
];

/** 生成 Part 练习模式 */
export function getPartPracticeConfigs(): TestModeConfig[] {
  return TOEIC_PARTS.map((p) => ({
    mode: 'part-practice' as const,
    label: `Part ${p.part} - ${p.titleZh}`,
    description: p.description,
    totalQuestions: p.questionCount,
    totalTimeMinutes: Math.ceil(p.questionCount * 0.75), // 约 45 秒/题
    parts: [p.part],
  }));
}
