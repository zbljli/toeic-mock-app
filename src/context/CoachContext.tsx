import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  OnboardingStage, UserGoal, AbilityProfile,
  LearningRecommendation, DailyTasks, AssessmentResult,
  TrainingRecord, ScoreRecord, MistakeEntry,
  GrowthDiary, ProgressRecord, UserStory,
} from '../types/coach';
import { generateDailyTasks } from '../engines/trainingPlanEngine';

/** Bump this when onboarding flow changes to force re-welcome */
const COACH_VERSION = 2;
const VERSION_KEY = '@coach_version';

/** Incomplete onboarding auto-resets after this many hours */
const ONBOARDING_EXPIRY_HOURS = 24;
const ONBOARDING_TS_KEY = '@coach_onboarding_ts';

const STORAGE_KEYS = {
  ONBOARDING_STAGE: '@coach_onboarding_stage',
  USER_GOAL: '@coach_user_goal',
  ABILITY_PROFILE: '@coach_ability_profile',
  RECOMMENDATION: '@coach_recommendation',
  ASSESSMENTS: '@coach_assessments',
  TRAINING_RECORDS: '@coach_training_records',
  SCORE_HISTORY: '@coach_score_history',
  DAILY_TASKS: '@coach_daily_tasks',
  MISTAKE_BANK: '@coach_mistake_bank',
  DIARIES: '@coach_diaries',
  PROGRESS_HISTORY: '@coach_progress_history',
  USER_STORIES: '@coach_user_stories',
};

interface CoachContextValue {
  // Onboarding
  onboardingStage: OnboardingStage;
  setOnboardingStage: (s: OnboardingStage) => Promise<void>;
  isOnboarded: boolean;

  // Goal
  userGoal: UserGoal | null;
  saveUserGoal: (g: UserGoal) => Promise<void>;

  // Assessment
  assessmentHistory: AssessmentResult[];
  saveAssessment: (a: AssessmentResult) => Promise<void>;

  // Ability
  abilityProfile: AbilityProfile | null;
  saveAbilityProfile: (p: AbilityProfile) => Promise<void>;

  // Recommendation
  recommendation: LearningRecommendation | null;
  saveRecommendation: (r: LearningRecommendation) => Promise<void>;

  // Daily tasks
  dailyTasks: DailyTasks | null;
  refreshDailyTasks: () => Promise<void>;
  completeDailyTasks: () => Promise<void>;

  // Training history
  trainingHistory: TrainingRecord[];
  addTrainingRecord: (r: TrainingRecord) => Promise<void>;

  // Score history
  scoreHistory: ScoreRecord[];
  addScoreRecord: (r: ScoreRecord) => Promise<void>;

  // Mistake bank
  mistakeBank: MistakeEntry[];
  addMistakes: (m: MistakeEntry[]) => Promise<void>;

  // Diaries (NEW V2)
  diaries: GrowthDiary[];
  saveDiary: (d: GrowthDiary) => Promise<void>;
  getLatestDiary: () => GrowthDiary | null;

  // Progress history (NEW V2)
  progressHistory: ProgressRecord[];
  addProgressRecord: (r: ProgressRecord) => Promise<void>;

  // User stories (NEW V2)
  userStories: UserStory[];
  addUserStory: (s: UserStory) => Promise<void>;

  // Loading
  loading: boolean;
}

const CoachContext = createContext<CoachContextValue | null>(null);

export function CoachProvider({ children }: { children: ReactNode }) {
  const [onboardingStage, setOnboardingStageState] = useState<OnboardingStage>('welcome');
  const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
  const [abilityProfile, setAbilityProfile] = useState<AbilityProfile | null>(null);
  const [recommendation, setRecommendation] = useState<LearningRecommendation | null>(null);
  const [dailyTasks, setDailyTasks] = useState<DailyTasks | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResult[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingRecord[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreRecord[]>([]);
  const [mistakeBank, setMistakeBank] = useState<MistakeEntry[]>([]);
  const [diaries, setDiaries] = useState<GrowthDiary[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressRecord[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);

  const isOnboarded = onboardingStage === 'completed';

  // Load all persisted data on mount
  useEffect(() => {
    (async () => {
      try {
        // ── Version migration ──
        const storedVersion = await AsyncStorage.getItem(VERSION_KEY);
        const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

        const [
          stage, goal, profile, rec, assess, train, scores, tasks, mistakes,
          savedDiaries, savedProgress, savedStories,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STAGE),
          AsyncStorage.getItem(STORAGE_KEYS.USER_GOAL),
          AsyncStorage.getItem(STORAGE_KEYS.ABILITY_PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.RECOMMENDATION),
          AsyncStorage.getItem(STORAGE_KEYS.ASSESSMENTS),
          AsyncStorage.getItem(STORAGE_KEYS.TRAINING_RECORDS),
          AsyncStorage.getItem(STORAGE_KEYS.SCORE_HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_TASKS),
          AsyncStorage.getItem(STORAGE_KEYS.MISTAKE_BANK),
          AsyncStorage.getItem(STORAGE_KEYS.DIARIES),
          AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.USER_STORIES),
        ]);

        // Migrate: if version is old, reset onboarding to welcome screen
        if (currentVersion < COACH_VERSION) {
          setOnboardingStageState('welcome');
          await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STAGE, 'welcome');
          await AsyncStorage.setItem(ONBOARDING_TS_KEY, String(Date.now()));
          await AsyncStorage.setItem(VERSION_KEY, String(COACH_VERSION));
        } else if (stage) {
          // Expire incomplete onboarding after N hours (prevents users getting stuck mid-flow)
          const stageVal = stage as OnboardingStage;
          if (stageVal !== 'completed') {
            const savedTs = await AsyncStorage.getItem(ONBOARDING_TS_KEY);
            const elapsed = savedTs ? Date.now() - parseInt(savedTs, 10) : Infinity;
            if (elapsed > ONBOARDING_EXPIRY_HOURS * 3600_000) {
              setOnboardingStageState('welcome');
              await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STAGE, 'welcome');
              await AsyncStorage.setItem(ONBOARDING_TS_KEY, String(Date.now()));
            } else {
              setOnboardingStageState(stageVal);
            }
          } else {
            setOnboardingStageState('completed');
          }
        }

        if (goal) setUserGoal(JSON.parse(goal));
        if (profile) setAbilityProfile(JSON.parse(profile));
        if (rec) setRecommendation(JSON.parse(rec));
        if (assess) setAssessmentHistory(JSON.parse(assess));
        if (train) setTrainingHistory(JSON.parse(train));
        if (scores) setScoreHistory(JSON.parse(scores));
        if (tasks) setDailyTasks(JSON.parse(tasks));
        if (mistakes) setMistakeBank(JSON.parse(mistakes));
        if (savedDiaries) setDiaries(JSON.parse(savedDiaries));
        if (savedProgress) setProgressHistory(JSON.parse(savedProgress));
        if (savedStories) setUserStories(JSON.parse(savedStories));
      } catch (e) {
        console.warn('[CoachContext] Load error:', e);
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (key: string, value: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  const setOnboardingStage = useCallback(async (s: OnboardingStage) => {
    setOnboardingStageState(s);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STAGE, s);
    await AsyncStorage.setItem(ONBOARDING_TS_KEY, String(Date.now()));
  }, []);

  const saveUserGoal = useCallback(async (g: UserGoal) => {
    setUserGoal(g);
    await persist(STORAGE_KEYS.USER_GOAL, g);
  }, []);

  const saveAssessment = useCallback(async (a: AssessmentResult) => {
    setAssessmentHistory(prev => {
      const next = [...prev, a];
      AsyncStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(next));
      return next;
    });
  }, []);

  const saveAbilityProfile = useCallback(async (p: AbilityProfile) => {
    setAbilityProfile(p);
    await persist(STORAGE_KEYS.ABILITY_PROFILE, p);
  }, []);

  const saveRecommendation = useCallback(async (r: LearningRecommendation) => {
    setRecommendation(r);
    await persist(STORAGE_KEYS.RECOMMENDATION, r);
  }, []);

  const refreshDailyTasks = useCallback(async () => {
    if (!recommendation) return;
    const tasks = generateDailyTasks(recommendation);
    setDailyTasks(tasks);
    await persist(STORAGE_KEYS.DAILY_TASKS, tasks);
  }, [recommendation]);

  const completeDailyTasks = useCallback(async () => {
    if (!dailyTasks) return;
    const completed = { ...dailyTasks, isCompleted: true };
    setDailyTasks(completed);
    await persist(STORAGE_KEYS.DAILY_TASKS, completed);
  }, [dailyTasks]);

  const addTrainingRecord = useCallback(async (r: TrainingRecord) => {
    setTrainingHistory(prev => {
      const next = [...prev, r];
      AsyncStorage.setItem(STORAGE_KEYS.TRAINING_RECORDS, JSON.stringify(next));
      return next;
    });
  }, []);

  const addScoreRecord = useCallback(async (r: ScoreRecord) => {
    setScoreHistory(prev => {
      const next = [...prev, r];
      AsyncStorage.setItem(STORAGE_KEYS.SCORE_HISTORY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addMistakes = useCallback(async (m: MistakeEntry[]) => {
    setMistakeBank(prev => {
      const next = [...prev, ...m];
      AsyncStorage.setItem(STORAGE_KEYS.MISTAKE_BANK, JSON.stringify(next));
      return next;
    });
  }, []);

  // ──── V2: Diary methods ────

  const saveDiary = useCallback(async (d: GrowthDiary) => {
    setDiaries(prev => {
      // Replace if same date, otherwise append
      const idx = prev.findIndex(x => x.date === d.date);
      const next = idx >= 0
        ? [...prev.slice(0, idx), d, ...prev.slice(idx + 1)]
        : [...prev, d];
      AsyncStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(next));
      return next;
    });
  }, []);

  const getLatestDiary = useCallback((): GrowthDiary | null => {
    if (diaries.length === 0) return null;
    return diaries.reduce((latest, d) =>
      d.dayNumber > latest.dayNumber ? d : latest, diaries[0]);
  }, [diaries]);

  // ──── V2: Progress methods ────

  const addProgressRecord = useCallback(async (r: ProgressRecord) => {
    setProgressHistory(prev => {
      const next = [...prev, r];
      AsyncStorage.setItem(STORAGE_KEYS.PROGRESS_HISTORY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ──── V2: User stories ────

  const addUserStory = useCallback(async (s: UserStory) => {
    setUserStories(prev => {
      const next = [...prev, s];
      AsyncStorage.setItem(STORAGE_KEYS.USER_STORIES, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <CoachContext.Provider
      value={{
        onboardingStage, setOnboardingStage, isOnboarded,
        userGoal, saveUserGoal,
        assessmentHistory, saveAssessment,
        abilityProfile, saveAbilityProfile,
        recommendation, saveRecommendation,
        dailyTasks, refreshDailyTasks, completeDailyTasks,
        trainingHistory, addTrainingRecord,
        scoreHistory, addScoreRecord,
        mistakeBank, addMistakes,
        diaries, saveDiary, getLatestDiary,
        progressHistory, addProgressRecord,
        userStories, addUserStory,
        loading,
      }}
    >
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoach must be used within CoachProvider');
  return ctx;
}
