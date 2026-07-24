import type { ToeicPart } from '../types';
import type { AssessmentResult, AbilityProfile, PartScore, ErrorType } from '../types/coach';

/**
 * Diagnosis Engine — 纯规则引擎
 *
 * 输入：测评结果 (各 Part 正确率)
 * 输出：能力画像 + 薄弱点分析
 */

interface DiagnosisOutput {
  profile: AbilityProfile;
  weakness: {
    part: ToeicPart;
    reason: string;
    detail: string;
    severity: 'critical' | 'moderate' | 'mild';
  };
}

const PART_WEIGHTS: Record<ToeicPart, number> = {
  1: 0.15,  // Part 1: 6 题，占比小
  2: 0.25,  // Part 2: 25 题
  3: 0.35,  // Part 3: 39 题，分值最重
  4: 0.25,  // Part 4: 30 题
  5: 0, 6: 0, 7: 0,
};

const WEAKNESS_REASONS: Record<ToeicPart, { reason: string; detail: string }> = {
  1: {
    reason: 'Difficulty identifying photo scenarios',
    detail: 'Practice common scene vocabulary and action expressions. Train to quickly extract key visual information from photos.',
  },
  2: {
    reason: 'Slow response to Q&A patterns',
    detail: 'Strengthen question-word recognition and synonym matching. Improve response speed to question-response patterns under time pressure.',
  },
  3: {
    reason: 'Difficulty tracking longer conversations',
    detail: 'Part 3 carries the highest weight. Focus on keyword capture and speaker tracking in multi-speaker conversations — this is your fastest path to score gains.',
  },
  4: {
    reason: 'Difficulty understanding talks and announcements',
    detail: 'Practice intensive listening to announcements, news extracts, and informational talks. Improve extraction of structured information and key details.',
  },
  5: { reason: '', detail: '' },
  6: { reason: '', detail: '' },
  7: { reason: '', detail: '' },
};

/** 根据正确率判断严重程度 */
function severityFromAccuracy(acc: number): 'critical' | 'moderate' | 'mild' {
  if (acc < 0.40) return 'critical';
  if (acc < 0.60) return 'moderate';
  return 'mild';
}

/** 核心诊断函数 */
export function diagnose(assessment: AssessmentResult): DiagnosisOutput {
  const { partScores } = assessment;

  const accuracies: Partial<Record<ToeicPart, number>> = {};
  for (const part of [1, 2, 3, 4] as ToeicPart[]) {
    accuracies[part] = partScores[part]?.accuracy ?? 0;
  }

  // 找到最弱和最强的 Part
  let weakestPart: ToeicPart = 3;
  let weakestAcc = 1;
  let strongestPart: ToeicPart = 1;
  let strongestAcc = 0;

  for (const part of [1, 2, 3, 4] as ToeicPart[]) {
    const acc = accuracies[part] ?? 0;
    if (acc < weakestAcc) { weakestAcc = acc; weakestPart = part; }
    if (acc > strongestAcc) { strongestAcc = acc; strongestPart = part; }
  }

  // 多 Part 都弱时，按权重选择
  const weakParts = ([1, 2, 3, 4] as ToeicPart[]).filter(p => (accuracies[p] ?? 0) < 0.60);
  if (weakParts.length > 1) {
    // 选权重最大的
    weakestPart = weakParts.sort((a, b) => PART_WEIGHTS[b] - PART_WEIGHTS[a])[0];
    weakestAcc = accuracies[weakestPart] ?? 0;
  }

  const overallAcc =
    ([1, 2, 3, 4] as ToeicPart[]).reduce((sum, p) => sum + (accuracies[p] ?? 0), 0) / 4;

  const profile: AbilityProfile = {
    part1Accuracy: accuracies[1] ?? 0,
    part2Accuracy: accuracies[2] ?? 0,
    part3Accuracy: accuracies[3] ?? 0,
    part4Accuracy: accuracies[4] ?? 0,
    overallAccuracy: Math.round(overallAcc * 100) / 100,
    weakestPart,
    weakestAccuracy: weakestAcc,
    strengthPart: strongestPart,
    strengthAccuracy: strongestAcc,
  };

  const weaknessMeta = WEAKNESS_REASONS[weakestPart];

  return {
    profile,
    weakness: {
      part: weakestPart,
      reason: weaknessMeta.reason,
      detail: weaknessMeta.detail,
      severity: severityFromAccuracy(weakestAcc),
    },
  };
}

/** 根据原始分数估算正确率（用于测评后） */
export function estimateAccuracyFromScore(rawCorrect: Partial<Record<ToeicPart, number>>, rawTotal: Partial<Record<ToeicPart, number>>): Partial<Record<ToeicPart, PartScore>> {
  const result: Partial<Record<ToeicPart, PartScore>> = {};
  for (const part of [1, 2, 3, 4] as ToeicPart[]) {
    const correct = rawCorrect[part] ?? 0;
    const total = rawTotal[part] ?? 1;
    result[part] = {
      correct,
      total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) / 100 : 0,
      errorTypes: inferErrorTypes(part, correct / Math.max(total, 1)),
    };
  }
  return result;
}

/** 基于正确率推断错误类型 */
function inferErrorTypes(part: ToeicPart, accuracy: number): ErrorType[] {
  const types: ErrorType[] = [];
  if (accuracy < 0.5) {
    types.push('key_info_missed');
    types.push('vocabulary_gap');
  }
  if (accuracy < 0.6) {
    if (part === 3) types.push('speaker_confusion', 'context_missed');
    if (part === 2) types.push('distractor_confused');
    if (part === 4) types.push('inference_error');
  }
  if (types.length === 0 && accuracy < 0.8) {
    types.push('distractor_confused');
  }
  return types;
}

/** 估算 TOEIC 听力分数 (raw → scaled, 5-495) */
export function estimateListeningScore(rawCorrect: number, rawTotal: number): number {
  const accuracy = rawTotal > 0 ? rawCorrect / rawTotal : 0;
  // Simplified TOEIC score mapping
  if (accuracy >= 0.95) return 450 + Math.round((accuracy - 0.95) * 900);
  if (accuracy >= 0.85) return 350 + Math.round((accuracy - 0.85) * 1000);
  if (accuracy >= 0.70) return 250 + Math.round((accuracy - 0.70) * 667);
  if (accuracy >= 0.50) return 150 + Math.round((accuracy - 0.50) * 500);
  if (accuracy >= 0.30) return 50 + Math.round((accuracy - 0.30) * 500);
  return Math.max(5, Math.round(accuracy * 167));
}
