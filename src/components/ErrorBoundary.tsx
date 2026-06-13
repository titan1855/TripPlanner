import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from './ui/Button';
import { COLORS } from '../utils/constants';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

/** 全域錯誤邊界：避免單一 render 例外讓整個 PWA 白屏 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      this.setState({ error: null });
    }
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵‍💫</Text>
          <Text style={styles.title}>畫面出了點狀況</Text>
          <Text style={styles.message}>
            重新載入通常就能恢復。你已儲存的行程資料不會遺失。
          </Text>
          <Button title="重新載入" onPress={this.handleReload} style={styles.button} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.background,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  button: { marginTop: 24, minWidth: 200 },
});
