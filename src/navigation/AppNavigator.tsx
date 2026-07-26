import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer, useNavigation, NavigatorScreenParams } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useCoach } from '../context/CoachContext';
import type { TestModeConfig } from '../types';

// ── Onboarding ──
import OnboardingFlow from '../screens/onboarding/OnboardingFlow';

// ── Main tab screens ──
import CoachHomeScreen from '../screens/coach/CoachHomeScreen';
import TrainingCenterScreen from '../screens/coach/TrainingCenterScreen';
import ScenarioLearningScreen from '../screens/coach/ScenarioLearningScreen';
import ScenarioArticleScreen from '../screens/coach/ScenarioArticleScreen';
import ProfileScreen from '../screens/coach/ProfileScreen';

// ── Sub screens ──
import TestScreen from '../screens/TestScreen';
import ResultScreen from '../screens/ResultScreen';
import ReviewScreen from '../screens/ReviewScreen';
import HistoryScreen from '../screens/HistoryScreen';
import VocabDashboardScreen from '../screens/VocabDashboardScreen';
import VocabSceneScreen from '../screens/VocabSceneScreen';
import VocabularyQuizScreen from '../screens/VocabularyQuizScreen';
import GrammarWikiScreen from '../screens/GrammarWikiScreen';
import GrammarQuizScreen from '../screens/GrammarQuizScreen';

// ═══════════════════════════════════════════════════════
//  Types — Tab-level param lists
// ═══════════════════════════════════════════════════════

export type HomeTabParamList = {
  HomeMain: undefined;
  Test: { config: TestModeConfig };
  Result: undefined;
  Review: undefined;
  History: undefined;
};

export type TrainingTabParamList = {
  TrainingMain: undefined;
};

export type ScenariosTabParamList = {
  ScenariosMain: undefined;
  ScenarioArticle: { sceneId: string; sceneTitle: string; sceneIcon: string };
};

export type VocabTabParamList = {
  VocabMain: undefined;
  VocabScene: { sceneId: string; sceneTitle: string; sceneIcon: string };
  VocabularyQuiz: undefined;
  GrammarWiki: undefined;
  GrammarQuiz: { grammarId: string };
};

export type MeTabParamList = {
  MeMain: undefined;
};

// ═══════════════════════════════════════════════════════
//  Root param list (onboarding + main tabs)
// ═══════════════════════════════════════════════════════

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  // Onboarding-only test flow (no tab bar yet)
  OnboardingTest: { config: TestModeConfig };
  OnboardingResult: undefined;
  Result: undefined; // fallback — used by TestScreen navigation.replace
};

// ═══════════════════════════════════════════════════════
//  Tab icon helper
// ═══════════════════════════════════════════════════════

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

// ═══════════════════════════════════════════════════════
//  Per-tab Stack Navigators
//  (tab bar stays visible because these nest INSIDE Tab)
// ═══════════════════════════════════════════════════════

const HomeStack = createStackNavigator<HomeTabParamList>();
function HomeTab() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={CoachHomeScreen} />
      <HomeStack.Screen name="Test" component={TestScreen} options={{ gestureEnabled: false }} />
      <HomeStack.Screen name="Result" component={ResultScreen} options={{ gestureEnabled: false }} />
      <HomeStack.Screen name="Review" component={ReviewScreen} />
      <HomeStack.Screen name="History" component={HistoryScreen} />
    </HomeStack.Navigator>
  );
}

const TrainingStack = createStackNavigator<TrainingTabParamList>();
function TrainingTab() {
  return (
    <TrainingStack.Navigator screenOptions={{ headerShown: false }}>
      <TrainingStack.Screen name="TrainingMain" component={TrainingCenterScreen} />
    </TrainingStack.Navigator>
  );
}

const ScenariosStack = createStackNavigator<ScenariosTabParamList>();
function ScenariosTab() {
  return (
    <ScenariosStack.Navigator screenOptions={{ headerShown: false }}>
      <ScenariosStack.Screen name="ScenariosMain" component={ScenarioLearningScreen} />
      <ScenariosStack.Screen name="ScenarioArticle" component={ScenarioArticleScreen} />
    </ScenariosStack.Navigator>
  );
}

const VocabStack = createStackNavigator<VocabTabParamList>();
function VocabTab() {
  return (
    <VocabStack.Navigator screenOptions={{ headerShown: false }}>
      <VocabStack.Screen name="VocabMain" component={VocabDashboardScreen} />
      <VocabStack.Screen name="VocabScene" component={VocabSceneScreen} />
      <VocabStack.Screen name="VocabularyQuiz" component={VocabularyQuizScreen} />
      <VocabStack.Screen name="GrammarWiki" component={GrammarWikiScreen} />
      <VocabStack.Screen name="GrammarQuiz" component={GrammarQuizScreen} />
    </VocabStack.Navigator>
  );
}

const MeStack = createStackNavigator<MeTabParamList>();
function MeTab() {
  return (
    <MeStack.Navigator screenOptions={{ headerShown: false }}>
      <MeStack.Screen name="MeMain" component={ProfileScreen} />
    </MeStack.Navigator>
  );
}

// ═══════════════════════════════════════════════════════
//  Bottom Tab Navigator — always visible
// ═══════════════════════════════════════════════════════

const Tab = createBottomTabNavigator();
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A237E',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0F0F0',
          paddingBottom: 4,
          height: 56,
          display: 'flex' as const,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        lazy: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeTab}
        options={{ tabBarLabel: 'Home', tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tab.Screen
        name="Training"
        component={TrainingTab}
        options={{ tabBarLabel: 'Training', tabBarIcon: () => <TabIcon emoji="🎧" /> }}
      />
      <Tab.Screen
        name="Scenarios"
        component={ScenariosTab}
        options={{ tabBarLabel: 'Scenarios', tabBarIcon: () => <TabIcon emoji="🌍" /> }}
      />
      <Tab.Screen
        name="Vocab"
        component={VocabTab}
        options={{ tabBarLabel: 'Vocab', tabBarIcon: () => <TabIcon emoji="📚" /> }}
      />
      <Tab.Screen
        name="Me"
        component={MeTab}
        options={{ tabBarLabel: 'Me', tabBarIcon: () => <TabIcon emoji="👤" /> }}
      />
    </Tab.Navigator>
  );
}

// ═══════════════════════════════════════════════════════
//  Root Navigator
// ═══════════════════════════════════════════════════════

const RootStack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isOnboarded, loading } = useCoach();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#1A237E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          // ── Onboarding Flow (no tab bar) ──
          <>
            <RootStack.Screen name="Onboarding" component={OnboardingFlow} />
            <RootStack.Screen name="OnboardingTest" component={TestScreen} options={{ gestureEnabled: false }} />
            <RootStack.Screen name="OnboardingResult" component={ResultScreen} options={{ gestureEnabled: false }} />
          </>
        ) : (
          // ── Main App (tab bar ALWAYS visible) ──
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
