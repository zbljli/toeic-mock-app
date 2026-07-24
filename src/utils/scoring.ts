import { Answer, Question, TestResult, ToeicPart } from '../types';

/**
 * TOEIC 分数转换表（简化版）
 * 实际 TOEIC 使用 IRT 模型，这里用线性插值近似
 *
 * 每个 Part 原始分 → 转换分 (5-495)
 * Listening: raw 0-100 → scaled 5-495
 * Reading:   raw 0-100 → scaled 5-495
 * Total: scaled L + scaled R → 10-990
 */

/** Listening 原始分 → 转换分 对照表（每 5 题一个节点） */
const LISTENING_CONVERSION: [number, number][] = [
  [0, 5], [5, 30], [10, 60], [15, 90], [20, 120],
  [25, 145], [30, 170], [35, 195], [40, 220], [45, 250],
  [50, 275], [55, 300], [60, 325], [65, 350], [70, 375],
  [75, 400], [80, 420], [85, 440], [90, 460], [95, 480], [100, 495],
];


function rawToScaled(raw: number, table: [number, number][]): number {
  if (raw <= 0) return table[0][1];
  if (raw >= 100) return table[table.length - 1][1];

  let lower = table[0];
  let upper = table[table.length - 1];

  for (const entry of table) {
    if (entry[0] <= raw) lower = entry;
    if (entry[0] >= raw) {
      upper = entry;
      break;
    }
  }

  if (lower[0] === upper[0]) return lower[1];
  const ratio = (raw - lower[0]) / (upper[0] - lower[0]);
  return Math.round(lower[1] + ratio * (upper[1] - lower[1]));
}

/** 计算听力考试成绩 */
export function calculateScore(
  answers: Answer[],
  questions: Question[],
): TestResult {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const correctByPart: Record<number, number> = {};
  const totalByPart: Record<number, number> = {};

  // 初始化
  for (const q of questions) {
    if (!totalByPart[q.part]) {
      totalByPart[q.part] = 0;
      correctByPart[q.part] = 0;
    }
    totalByPart[q.part]++;
  }

  let listeningCorrect = 0;

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    if (answer.selectedOptionId === question.correctOptionId) {
      correctByPart[question.part]++;
      listeningCorrect++;
    }
  }

  const listeningScore = rawToScaled(listeningCorrect, LISTENING_CONVERSION);

  return {
    listeningScore,
    readingScore: 0,
    totalScore: listeningScore,
    correctByPart: correctByPart as Record<ToeicPart, number>,
    totalByPart: totalByPart as Record<ToeicPart, number>,
    timeSpent: answers.reduce((sum, a) => sum + a.timeSpent, 0),
    completedAt: new Date().toISOString(),
  };
}

/** 获取听力分数等级描述（满分 495） */
export function getScoreLevel(totalScore: number): {
  level: string;
  color: string;
  description: string;
} {
  if (totalScore >= 450) {
    return { level: '听力卓越', color: '#4CAF50', description: '能够准确理解各种语境下的英语对话' };
  }
  if (totalScore >= 400) {
    return { level: '听力优秀', color: '#2196F3', description: '能在多数商务场合中准确理解对话内容' };
  }
  if (totalScore >= 300) {
    return { level: '听力良好', color: '#FF9800', description: '能理解日常和一般商务场景中的主要内容' };
  }
  if (totalScore >= 200) {
    return { level: '听力基础', color: '#FF5722', description: '能理解简单对话和常见话题' };
  }
  return { level: '听力入门', color: '#F44336', description: '需加强听力基础训练，继续加油' };
}
