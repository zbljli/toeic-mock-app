// ===== TOEIC Test Types =====

/** TOEIC 考试的 7 个 Parts */
export type ToeicPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 题目类型 */
export type QuestionType = 'listening' | 'reading';

/** 选项 */
export interface Option {
  id: string;
  text: string;
}

/** 单道题目 */
export interface Question {
  id: string;
  part: ToeicPart;
  type: QuestionType;
  /** 题目说明/题干 */
  prompt: string;
  /** 听力音频 URL（仅 Listening Part） */
  audioUrl?: string;
  /** 图片 URL（Part 1 有图片题） */
  imageUrl?: string;
  /** 阅读材料（Part 3, 4, 6, 7 有长文） */
  passage?: string;
  /** 选项列表 */
  options: Option[];
  /** 正确答案的 option id */
  correctOptionId: string;
  /** 听力文本（用于 review） */
  transcript?: string;
}

/** 用户对一道题的作答 */
export interface Answer {
  questionId: string;
  selectedOptionId: string | null;
  timeSpent: number; // seconds
}

/** 一次模拟考试的状态 */
export interface TestSession {
  id: string;
  startedAt: string;
  /** 选择的考试模式 */
  mode: TestMode;
  /** 当前做到第几题（0-based index） */
  currentQuestionIndex: number;
  /** 用户所有作答 */
  answers: Answer[];
  /** 各题剩余时间追踪 */
  partTimeRemaining: Record<string, number>;
  /** 考试是否完成 */
  isCompleted: boolean;
  /** 是否已经出分 */
  isScored: boolean;
}

/** 考试模式 */
export type TestMode =
  | 'full'            // 完整 200 题
  | 'listening-only'  // 仅听力 100 题
  | 'reading-only'    // 仅阅读 100 题
  | 'part-practice';  // 单 Part 练习

/** 考试模式配置 */
export interface TestModeConfig {
  mode: TestMode;
  label: string;
  description: string;
  totalQuestions: number;
  totalTimeMinutes: number;
  parts: ToeicPart[];
}

/** 考试成绩 */
export interface TestResult {
  listeningScore: number;  // 5-495
  readingScore: number;    // 5-495
  totalScore: number;      // 10-990
  correctByPart: Record<ToeicPart, number>;
  totalByPart: Record<ToeicPart, number>;
  timeSpent: number;
  completedAt: string;
}

/** 历史记录条目 */
export interface HistoryEntry {
  sessionId: string;
  mode: TestMode;
  modeLabel: string;
  result: TestResult | null;
  startedAt: string;
  isCompleted: boolean;
}
