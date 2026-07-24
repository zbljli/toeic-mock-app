import type { ToeicPart } from './index';

// ══════════════════════════════════════════════
//  TOEIC Listening AI Coach — Data Models V2
// ══════════════════════════════════════════════

// ── Onboarding ──

export type OnboardingStage =
  | 'welcome'
  | 'success_story'
  | 'goal_setting'
  | 'diagnostic_test'
  | 'diagnosis_report'
  | 'completed';

// ── User Goal ──

export interface UserGoal {
  currentListeningScore: number;
  targetListeningScore: number;
  scoreGap: number;
  setAt: string;
}

// ── Success Story (Onboarding Step 1) ──

export interface SuccessStoryPhase {
  label: string;
  focus: string;
  description: string;
}

export interface SuccessStory {
  id: string;
  nickname: string;
  avatarEmoji: string;
  startScore: number;
  targetScore: number;
  finalScore: number;
  improvement: number;
  totalDays: number;
  phases: SuccessStoryPhase[];
  testimonial: string;
}

// ── Assessment ──

export type ErrorType =
  | 'vocabulary_gap'
  | 'key_info_missed'
  | 'distractor_confused'
  | 'inference_error'
  | 'speaker_confusion'
  | 'context_missed';

export interface PartScore {
  correct: number;
  total: number;
  accuracy: number;
  errorTypes: ErrorType[];
}

export interface AssessmentResult {
  id: string;
  date: string;
  totalScore: number;
  partScores: Partial<Record<ToeicPart, PartScore>>;
  completedAt: string;
}

// ── Ability Profile ──

export interface AbilityProfile {
  part1Accuracy: number;
  part2Accuracy: number;
  part3Accuracy: number;
  part4Accuracy: number;
  overallAccuracy: number;
  weakestPart: ToeicPart;
  weakestAccuracy: number;
  strengthPart: ToeicPart;
  strengthAccuracy: number;
}

// ── Learning Recommendation ──

export type TrainingStage = 'foundation' | 'breakthrough' | 'consolidation';

export type TrainingTaskType =
  | 'mock_test'
  | 'part_training'
  | 'scene_listening'
  | 'mistake_review'
  | 'vocab_study';

export interface TrainingTask {
  id: string;
  type: TrainingTaskType;
  part?: ToeicPart;
  sceneId?: string;
  questionCount: number;
  durationMinutes: number;
  priority: 'high' | 'medium' | 'low';
  label: string;
  icon: string;
}

export interface LearningRecommendation {
  id: string;
  generatedAt: string;
  targetPart: ToeicPart;
  reason: string;
  detail: string;
  stage: TrainingStage;
  tasks: TrainingTask[];
  estimatedDays: number;
}

// ── Daily Tasks ──

export interface DailyTasks {
  date: string;
  tasks: TrainingTask[];
  isCompleted: boolean;
  totalDurationMinutes: number;
}

// ── Training Record ──

export interface MistakeEntry {
  questionId: string;
  part: ToeicPart;
  userAnswer: string;
  correctAnswer: string;
  errorType: ErrorType;
  transcript?: string;
}

export interface TrainingRecord {
  id: string;
  date: string;
  type: TrainingTaskType;
  part?: ToeicPart;
  questionCount: number;
  correctCount: number;
  accuracy: number;
  durationMinutes: number;
}

// ── Score History ──

export interface ScoreRecord {
  date: string;
  type: 'assessment' | 'mock_test';
  listeningScore: number;
  partScores: Partial<Record<ToeicPart, PartScore>>;
}

// ── Growth Diary (NEW V2) ──

export type DiaryMood = 'great' | 'good' | 'okay' | 'tired';

export interface GrowthDiary {
  id: string;
  dayNumber: number;
  date: string;
  createdAt: string;
  content: string;
  challenges: string;
  tomorrowPlan: string;
  completedTaskIds: string[];
  scoreSnapshot: number;
  vocabularyCount: number;
  listeningScore?: number;
  mood?: DiaryMood;
}

// ── Progress Record (Timeline) ──

export interface ProgressRecord {
  id: string;
  date: string;
  listeningScore: number;
  vocabularyCount: number;
  completedTasks: number;
  diaryId?: string;
  isMilestone: boolean;
  milestoneLabel?: string;
}

// ── Community / User Story (NEW V2) ──

export interface Comment {
  id: string;
  storyId: string;
  nickname: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface UserStory {
  id: string;
  nickname: string;
  avatarEmoji: string;
  startScore: number;
  targetScore: number;
  currentScore: number;
  daysInProgram: number;
  totalDays: number;
  latestDiary?: {
    dayNumber: number;
    content: string;
    completedTasks: string[];
  };
  likes: number;
  comments: Comment[];
  createdAt: string;
}

// ── Coach State (aggregate context) ──

export interface CoachState {
  onboardingStage: OnboardingStage;
  userGoal: UserGoal | null;
  abilityProfile: AbilityProfile | null;
  recommendation: LearningRecommendation | null;
  dailyTasks: DailyTasks | null;
  assessmentHistory: AssessmentResult[];
  trainingHistory: TrainingRecord[];
  scoreHistory: ScoreRecord[];
  mistakeBank: MistakeEntry[];
  diaries: GrowthDiary[];
  progressHistory: ProgressRecord[];
  userStories: UserStory[];
  communityStories: UserStory[];
}
