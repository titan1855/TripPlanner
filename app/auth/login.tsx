import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/store/auth';
import { COLORS } from '../../src/utils/constants';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('請輸入 Email 與密碼');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // 登入成功後由 root layout 的 auth guard 自動導向
    } catch (e: any) {
      Alert.alert('登入失敗', e.message ?? '請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.logo}>🧳</Text>
      <Text style={styles.title}>TripPlanner</Text>
      <Text style={styles.subtitle}>自助旅行神隊友</Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <Input
        label="密碼"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />
      <Button title="登入" onPress={handleLogin} loading={loading} />

      <TouchableOpacity
        style={styles.link}
        onPress={() => router.push('/auth/register')}
      >
        <Text style={styles.linkText}>
          還沒有帳號？<Text style={styles.linkHighlight}>註冊</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: { fontSize: 56, textAlign: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: COLORS.text,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: 32,
    marginTop: 4,
  },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  linkHighlight: { color: COLORS.primary, fontWeight: '600' },
});
