// ===== TOEIC AI Vocabulary Assessment System =====
//
// 核心设计：不是词典 App，而是场景化词汇评估系统
//
// 流程：选场景 → 闪卡评估（只显示英文词）→ 用户标记 认识/不认识
//       → 认识 → 展开释义+例句 → 不认识 → 进入未掌握列表
//
// 状态机：unreviewed → mastered / unknown

// ----- Word Entry (unchanged) -----

/** 词性 */
export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'phrase';

/** 难度等级 */
export type WordLevel = 'basic' | 'intermediate' | 'advanced';

/** 单条释义 */
export interface WordMeaning {
  zh: string;
  context?: string;
}

/** 例句 */
export interface WordExample {
  en: string;
  zh: string;
}

/** 派生词 */
export interface WordDerivative {
  form: string;
  partOfSpeech: PartOfSpeech;
}

/** 单条词汇的完整定义 */
export interface WordEntry {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: PartOfSpeech;
  meanings: WordMeaning[];
  examples: WordExample[];
  sceneIds: string[];
  level: WordLevel;
  synonyms: string[];
  antonyms: string[];
  derivatives: WordDerivative[];
  frequency: number;
  tags: string[];
}

// ----- Scene (unchanged) -----

export interface SubScene {
  name: string;
  nameZh: string;
  wordIds: string[];
}

export interface ScenePhrase {
  en: string;
  zh: string;
}

export interface SceneEntry {
  id: string;
  name: string;
  nameZh: string;
  icon: string;
  description: string;
  wordIds: string[];
  phrases: ScenePhrase[];
  toeicParts: number[];
  subScenes?: SubScene[];
}

// ===== Assessment System Types =====

/** 单词掌握状态 */
export type WordStatus = 'new' | 'known' | 'learning';

/** 单个场景的学习进度 */
export interface SceneProgress {
  sceneId: string;
  total: number;
  unreviewed: number;
  mastered: number;
  unknown: number;
  /** 完成百分比 (mastered / total) */
  completionRate: number;
}

/** 全局学习统计 */
export interface VocabStats {
  totalWords: number;
  masteredWords: number;
  unknownWords: number;
  unreviewedWords: number;
  overallRate: number;
  sceneProgress: SceneProgress[];
}

/** 持久化的词汇状态：{ [wordId]: WordStatus } */
export interface VocabState {
  [wordId: string]: WordStatus;
}

/** Assessment 卡片展示阶段 */
export type AssessmentPhase = 'question' | 'reveal';
