import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  TestSession,
  TestMode,
  Answer,
  Question,
  TestResult,
} from '../types';

// ===== State =====
interface TestState {
  /** 所有可用题目（按 Part 排列） */
  questions: Question[];
  /** 当前考试 session */
  session: TestSession | null;
  /** 考试成绩 */
  result: TestResult | null;
  /** 历史记录 */
  history: TestSession[];
}

const initialState: TestState = {
  questions: [],
  session: null,
  result: null,
  history: [],
};

// ===== Actions =====
type TestAction =
  | { type: 'LOAD_QUESTIONS'; questions: Question[] }
  | { type: 'START_TEST'; mode: TestMode; sessionId: string }
  | { type: 'ANSWER_QUESTION'; answer: Answer }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'GO_TO_QUESTION'; index: number }
  | { type: 'COMPLETE_TEST'; result: TestResult }
  | { type: 'RESET' };

// ===== Reducer =====
function testReducer(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case 'LOAD_QUESTIONS':
      return { ...state, questions: action.questions };

    case 'START_TEST':
      return {
        ...state,
        result: null,
        session: {
          id: action.sessionId,
          startedAt: new Date().toISOString(),
          mode: action.mode,
          currentQuestionIndex: 0,
          answers: [],
          partTimeRemaining: {},
          isCompleted: false,
          isScored: false,
        },
      };

    case 'ANSWER_QUESTION': {
      if (!state.session) return state;
      const existingIdx = state.session.answers.findIndex(
        (a) => a.questionId === action.answer.questionId,
      );
      const newAnswers =
        existingIdx >= 0
          ? state.session.answers.map((a, i) =>
              i === existingIdx ? action.answer : a,
            )
          : [...state.session.answers, action.answer];
      return {
        ...state,
        session: { ...state.session, answers: newAnswers },
      };
    }

    case 'NEXT_QUESTION': {
      if (!state.session) return state;
      const maxIdx = state.questions.length - 1;
      return {
        ...state,
        session: {
          ...state.session,
          currentQuestionIndex: Math.min(
            state.session.currentQuestionIndex + 1,
            maxIdx,
          ),
        },
      };
    }

    case 'PREV_QUESTION': {
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          currentQuestionIndex: Math.max(
            state.session.currentQuestionIndex - 1,
            0,
          ),
        },
      };
    }

    case 'GO_TO_QUESTION':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          currentQuestionIndex: action.index,
        },
      };

    case 'COMPLETE_TEST':
      if (!state.session) return state;
      const completedSession = {
        ...state.session,
        isCompleted: true,
        isScored: true,
      };
      return {
        ...state,
        session: completedSession,
        result: action.result,
        history: [...state.history, completedSession],
      };

    case 'RESET':
      return { ...state, session: null, result: null };

    default:
      return state;
  }
}

// ===== Context =====
interface TestContextValue {
  state: TestState;
  dispatch: React.Dispatch<TestAction>;
}

const TestContext = createContext<TestContextValue | null>(null);

export function TestProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(testReducer, initialState);
  return (
    <TestContext.Provider value={{ state, dispatch }}>
      {children}
    </TestContext.Provider>
  );
}

export function useTestContext(): TestContextValue {
  const ctx = useContext(TestContext);
  if (!ctx) {
    throw new Error('useTestContext must be used within TestProvider');
  }
  return ctx;
}

// ===== Helpers =====
export function getCurrentQuestion(state: TestState): Question | null {
  if (!state.session) return null;
  return state.questions[state.session.currentQuestionIndex] ?? null;
}

export function getAnswerForQuestion(
  state: TestState,
  questionId: string,
): Answer | undefined {
  return state.session?.answers.find((a) => a.questionId === questionId);
}

export function getAnsweredCount(state: TestState): number {
  return state.session?.answers.filter((a) => a.selectedOptionId !== null).length ?? 0;
}
