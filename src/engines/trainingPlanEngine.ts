import type { LearningRecommendation, DailyTasks } from '../types/coach';

/**
 * Training Plan Engine
 *
 * 基于推荐生成每日任务
 */

export function generateDailyTasks(
  recommendation: LearningRecommendation,
): DailyTasks {
  const today = new Date().toISOString().split('T')[0];

  // 筛选当天任务：取高优先级的前 3-4 个
  const highPriority = recommendation.tasks.filter(t => t.priority === 'high');
  const mediumPriority = recommendation.tasks.filter(t => t.priority === 'medium');

  const dailyTasks = [...highPriority, ...mediumPriority].slice(0, 4);

  const totalDurationMinutes = dailyTasks.reduce((sum, t) => sum + t.durationMinutes, 0);

  return {
    date: today,
    tasks: dailyTasks,
    isCompleted: false,
    totalDurationMinutes,
  };
}
