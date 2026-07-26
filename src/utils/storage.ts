import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestSession, TestResult, TestMode, ToeicPart } from '../types';

const HISTORY_KEY = '@toeic_history';
const IN_PROGRESS_KEY = '@toeic_in_progress';

/** Persisted entry — session metadata + result */
export interface PersistedHistoryEntry {
  sessionId: string;
  mode: TestMode;
  modeLabel: string;
  startedAt: string;
  isCompleted: boolean;
  totalQuestions: number;
  answeredCount: number;
  result: TestResult | null;
}

/** Serialized snapshot of an in-progress exam (for crash recovery) */
export interface InProgressSnapshot {
  sessionId: string;
  mode: TestMode;
  modeLabel: string;
  startedAt: string;
  currentQuestionIndex: number;
  /** Saved answers with selected options */
  answers: Array<{ questionId: string; selectedOptionId: string }>;
  parts: ToeicPart[];
  totalQuestions: number;
  totalTimeMinutes: number;
  /** Seconds already elapsed when the snapshot was saved */
  elapsedSeconds: number;
}

// ===== History =====

export async function loadHistory(): Promise<PersistedHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PersistedHistoryEntry[];
  } catch (e) {
    console.warn('[Storage] Failed to load history:', e);
    return [];
  }
}

export async function saveHistory(history: PersistedHistoryEntry[]): Promise<void> {
  try {
    const trimmed = history.slice(-50); // keep last 50 entries
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[Storage] Failed to save history:', e);
  }
}

export async function appendHistoryEntry(entry: PersistedHistoryEntry): Promise<void> {
  const history = await loadHistory();
  history.push(entry);
  await saveHistory(history);
}

// ===== In-Progress Recovery =====

export async function saveInProgress(snapshot: InProgressSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('[Storage] Failed to save in-progress:', e);
  }
}

export async function loadInProgress(): Promise<InProgressSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(IN_PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InProgressSnapshot;
  } catch (e) {
    console.warn('[Storage] Failed to load in-progress:', e);
    return null;
  }
}

export async function clearInProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(IN_PROGRESS_KEY);
  } catch (e) {
    console.warn('[Storage] Failed to clear in-progress:', e);
  }
}

// ===== Vocabulary Assessment State =====

import type { VocabState, WordStatus } from '../types/vocabulary';

/** Map old status values → new status values (backward compatible) */
const STATUS_MIGRATION_MAP: Record<string, WordStatus> = {
  unreviewed: 'new',
  mastered: 'known',
  unknown: 'learning',
};

/** @deprecated — use VocabState with WordStatus */
export interface SceneMastery {
  [wordId: string]: boolean;
}

function vocabStateKey(sceneId: string): string {
  return `@toeic_vocab_${sceneId}`;
}

function masteryKey(sceneId: string): string {
  return `@toeic_mastery_${sceneId}`;
}

/** Load the assessment state for one scene */
export async function loadVocabState(sceneId: string): Promise<VocabState> {
  try {
    const raw = await AsyncStorage.getItem(vocabStateKey(sceneId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    // Migrate old status values to new ones
    const migrated: VocabState = {};
    for (const [wordId, status] of Object.entries(parsed)) {
      migrated[wordId] = (STATUS_MIGRATION_MAP[status] ?? status) as WordStatus;
    }
    return migrated;
  } catch (e) {
    console.warn('[Storage] Failed to load vocab state:', e);
    return {};
  }
}

/** Save the assessment state for one scene */
export async function saveVocabState(
  sceneId: string,
  state: VocabState,
): Promise<void> {
  try {
    await AsyncStorage.setItem(vocabStateKey(sceneId), JSON.stringify(state));
  } catch (e) {
    console.warn('[Storage] Failed to save vocab state:', e);
  }
}

/** Update a single word's status */
export async function setWordStatus(
  sceneId: string,
  wordId: string,
  status: WordStatus,
): Promise<VocabState> {
  const state = await loadVocabState(sceneId);
  state[wordId] = status;
  await saveVocabState(sceneId, state);
  return state;
}

/** Migrate old mastery data to new vocab state format */
export async function migrateMasteryIfNeeded(sceneId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(masteryKey(sceneId));
    if (!raw) return;
    const old = JSON.parse(raw) as SceneMastery;
    // Old format: { wordId: true|false }
    // New format: { wordId: 'known'|'learning' }
    const state = await loadVocabState(sceneId);
    let migrated = false;
    for (const [wid, knownFlag] of Object.entries(old)) {
      if (!(wid in state)) {
        state[wid] = knownFlag ? 'known' : 'learning';
        migrated = true;
      }
    }
    if (migrated) {
      await saveVocabState(sceneId, state);
      // Don't delete old data, just in case
    }
  } catch (e) {
    // Ignore migration errors
  }
}

/** @deprecated — use loadVocabState */
export async function loadSceneMastery(sceneId: string): Promise<SceneMastery> {
  try {
    const raw = await AsyncStorage.getItem(masteryKey(sceneId));
    if (!raw) return {};
    return JSON.parse(raw) as SceneMastery;
  } catch (e) {
    console.warn('[Storage] Failed to load mastery:', e);
    return {};
  }
}

/** @deprecated — use saveVocabState */
export async function saveSceneMastery(
  sceneId: string,
  mastery: SceneMastery,
): Promise<void> {
  try {
    await AsyncStorage.setItem(masteryKey(sceneId), JSON.stringify(mastery));
  } catch (e) {
    console.warn('[Storage] Failed to save mastery:', e);
  }
}
