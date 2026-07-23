import { TestProvider } from './src/context/TestContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <TestProvider>
      <AppNavigator />
    </TestProvider>
  );
}
