import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

interface Props {
  children: ReactNode;
  /** Called before the error fallback renders, so callers can persist state */
  onError?: (error: Error, errorInfo: string) => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Global Error Boundary
 *
 * Catches unhandled render errors anywhere in the tree.
 * On crash during an exam, the parent can persist current progress
 * via the onError callback before the fallback UI replaces the tree.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const componentStack = errorInfo.componentStack ?? '';
    console.error('[ErrorBoundary]', error.message, componentStack);
    this.props.onError?.(error, componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Oops, something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error.{'\n'}
              Your test progress has been saved.
            </Text>
            {this.state.errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} selectable>
                  {this.state.errorMessage}
                </Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
  },
  errorText: {
    fontSize: 12,
    color: '#E65100',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
