import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { TestProvider, useTestContext } from './src/context/TestContext';
import { CoachProvider } from './src/context/CoachContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { loadHistory } from './src/utils/storage';

/** Inner component that loads persisted data before rendering the app */
function AppContent() {
  const { dispatch } = useTestContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const history = await loadHistory();
      dispatch({ type: 'LOAD_HISTORY', history });
      setIsReady(true);
    })();
  }, [dispatch]);

  if (!isReady) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashText}>TOEIC Listening AI</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <AppNavigator />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CoachProvider>
        <TestProvider>
          <AppContent />
        </TestProvider>
      </CoachProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#1A237E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    backgroundColor: '#EEEEEE',
    overflow: 'hidden',
    // Web 端加阴影模拟手机边框感
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 40px rgba(0,0,0,0.3)',
          marginVertical: 0,
          height: '100%',
        }
      : {}),
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1976D2',
  },
  splashText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
