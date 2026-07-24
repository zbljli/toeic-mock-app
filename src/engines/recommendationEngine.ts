import type { ToeicPart } from '../types';
import type {
  UserGoal, AbilityProfile, LearningRecommendation,
  TrainingTask, TrainingStage,
} from '../types/coach';

/**
 * Recommendation Engine — 纯规则引擎
 *
 * 输入：AbilityProfile + UserGoal
 * 输出：LearningRecommendation (训练路径 + 任务列表)
 */

/** 根据分数差距判定训练阶段 */
function determineStage(scoreGap: number): TrainingStage {
  if (scoreGap >= 150) return 'foundation';
  if (scoreGap >= 60) return 'breakthrough';
  return 'consolidation';
}

/** 默认训练强度 */
const DEFAULT_INTENSITY = { dailyMinutes: 30, taskMultiplier: 0.7 };

/** Part → 场景关联 */
const PART_SCENES: Partial<Record<ToeicPart, string[]>> = {
  1: ['s_office', 's_restaurant', 's_travel'],
  2: ['s_office', 's_telephone', 's_shopping'],
  3: ['s_meeting', 's_telephone', 's_travel', 's_office'],
  4: ['s_meeting', 's_travel', 's_hr'],
};

/** 各阶段任务分配权重 */
const STAGE_WEIGHTS: Record<TrainingStage, Record<string, number>> = {
  foundation: {
    vocab_study: 0.40,
    part_training: 0.35,
    scene_listening: 0.10,
    mistake_review: 0.10,
    mock_test: 0.05,
  },
  breakthrough: {
    part_training: 0.40,
    scene_listening: 0.25,
    mock_test: 0.20,
    vocab_study: 0.10,
    mistake_review: 0.05,
  },
  consolidation: {
    mock_test: 0.35,
    scene_listening: 0.25,
    part_training: 0.20,
    mistake_review: 0.15,
    vocab_study: 0.05,
  },
};

const WEAKNESS_DETAILS: Record<ToeicPart, { reason: string; detail: string }> = {
  1: {
    reason: 'Difficulty identifying photo scenarios',
    detail: 'Practice common scene vocabulary and action expressions. Though Part 1 has fewer questions, foundational vocabulary is essential for later breakthroughs.',
  },
  2: {
    reason: 'Slow response to Q&A patterns',
    detail: 'Part 2 tests real-time comprehension. Strengthen question-word recognition and synonym matching to build a natural feel for Q&A patterns.',
  },
  3: {
    reason: 'Difficulty tracking longer conversations',
    detail: 'Part 3 carries the highest weight. Focus on keyword capture and context prediction in multi-speaker conversations — this is your fastest path to score gains.',
  },
  4: {
    reason: 'Difficulty understanding talks and announcements',
    detail: 'Part 4 tests structured information extraction. Practice intensive listening to announcements and news-style talks to sharpen your sensitivity to key details.',
  },
  5: { reason: '', detail: '' },
  6: { reason: '', detail: '' },
  7: { reason: '', detail: '' },
};

/** 生成任务 */
function buildTasks(
  targetPart: ToeicPart,
  stage: TrainingStage,
  dailyMinutes: number,
  taskMultiplier: number,
): TrainingTask[] {
  const weights = STAGE_WEIGHTS[stage];
  const tasks: TrainingTask[] = [];

  const addTask = (
    type: TrainingTask['type'],
    icon: string,
    label: string,
    part?: ToeicPart,
    sceneId?: string,
    priority: TrainingTask['priority'] = 'high',
  ) => {
    const weight = weights[type] ?? 0.1;
    const qCount = Math.max(3, Math.round(20 * weight * taskMultiplier));
    const duration = Math.max(5, Math.round(dailyMinutes * weight));
    tasks.push({
      id: `${type}_${part ?? 'all'}_${Date.now()}_${tasks.length}`,
      type, icon, label, part, sceneId, priority,
      questionCount: qCount,
      durationMinutes: duration,
    });
  };

  // Part training for the weak part
  addTask('part_training', '🎧', `Part ${targetPart} Focused Practice`, targetPart);

  // Vocab study (foundation stage: higher priority)
  if (weights.vocab_study > 0.05) {
    const scene = PART_SCENES[targetPart]?.[0];
    addTask('vocab_study', '📚', 'Scene Vocabulary', undefined, scene, stage === 'foundation' ? 'high' : 'medium');
  }

  // Scene listening
  if (weights.scene_listening > 0.05) {
    const scene = PART_SCENES[targetPart]?.[0];
    addTask('scene_listening', '🎬', 'Scene Deep Listening', targetPart, scene, 'medium');
  }

  // Mock test
  if (weights.mock_test > 0.05) {
    addTask('mock_test', '📋', 'Full Mock Test', undefined, undefined, stage === 'consolidation' ? 'high' : 'medium');
  }

  // Mistake review
  if (weights.mistake_review > 0.05) {
    addTask('mistake_review', '📝', 'Mistake Review', targetPart, undefined, 'medium');
  }

  return tasks.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });
}

/** 核心推荐函数 */
export function generateRecommendation(
  profile: AbilityProfile,
  goal: UserGoal,
): LearningRecommendation {
  const stage = determineStage(goal.scoreGap);
  const { dailyMinutes, taskMultiplier } = DEFAULT_INTENSITY;
  const targetPart = profile.weakestPart;
  const weaknessInfo = WEAKNESS_DETAILS[targetPart];

  const tasks = buildTasks(targetPart, stage, dailyMinutes, taskMultiplier);

  const estimatedDays = (() => {
    // Rough estimate: each accuracy percentage point needs ~0.3 days
    const gap = 0.80 - profile.weakestAccuracy;
    return Math.max(7, Math.round(gap * 100 * 0.3));
  })();

  return {
    id: `rec_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    targetPart,
    reason: weaknessInfo.reason,
    detail: weaknessInfo.detail,
    stage,
    tasks,
    estimatedDays,
  };
}
