import { View, StyleSheet, Platform } from 'react-native';
import { TestProvider } from './src/context/TestContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <TestProvider>
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <AppNavigator />
        </View>
      </View>
    </TestProvider>
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
});
