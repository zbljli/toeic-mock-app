import React from 'react';
import { useCoach } from '../../context/CoachContext';
import WelcomeScreen from './WelcomeScreen';
import SuccessStoryScreen from './SuccessStoryScreen';
import GoalSettingScreen from './GoalSettingScreen';
import DiagnosticTestScreen from './DiagnosticTestScreen';
import DiagnosisReportScreen from './DiagnosisReportScreen';

/**
 * Onboarding Flow — single screen that conditionally renders
 * the correct step based on onboardingStage from CoachContext.
 *
 * V3 Flow:
 *   welcome → (5 questions | 100 questions | skip) → completed
 *
 * Legacy V2 Flow (4 steps):
 *   success_story → goal_setting → diagnostic_test → diagnosis_report → completed
 */
export default function OnboardingFlow() {
  const { onboardingStage } = useCoach();

  switch (onboardingStage) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'success_story':
      return <SuccessStoryScreen />;
    case 'goal_setting':
      return <GoalSettingScreen />;
    case 'diagnostic_test':
      return <DiagnosticTestScreen />;
    case 'diagnosis_report':
      return <DiagnosisReportScreen />;
    default:
      return <WelcomeScreen />;
  }
}
