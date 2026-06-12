import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/store/auth';
import { COLORS } from '../../src/utils/constants';

export default function RegisterScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert('請填寫所有欄位');
      return;
    }
    if (password.length < 6) {
      Alert.alert('密碼至少需要 6 個字元');
      return;
    }
    if (password !== confirm) {
      Alert.alert('兩次輸入的密碼不一致');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      // 若專案開啟 email 確認，這裡不會直接有 session
      Alert.alert('註冊成功', '若未自動登入，請檢查信箱完成驗證後再登入。');
    } catch (e: any) {
      Alert.alert('註冊失敗', e.message ?? '請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>建立帳號</Text>

        <Input
          label="暱稱"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="旅伴會看到的名字"
        />
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
          placeholder="至少 6 個字元"
        />
        <Input
          label="確認密碼"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="再輸入一次密碼"
        />
        <Button title="註冊" onPress={handleRegister} loading={loading} />

        <TouchableOpacity style={styles.link} onPress={() => router.back()}>
          <Text style={styles.linkText}>
            已經有帳號？<Text style={styles.linkHighlight}>回到登入</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  linkHighlight: { color: COLORS.primary, fontWeight: '600' },
});
