import { useRouter } from 'expo-router';
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
      const hasSession = await signUp(email.trim(), password, displayName.trim());
      if (!hasSession) {
        // 需要 email 驗證 → 跳回登入頁（帶入 email），驗證完直接登入
        Alert.alert(
          '驗證信已寄出 📮',
          `請到 ${email.trim()} 收信並點擊驗證連結，完成後回來輸入密碼登入。`,
          [
            {
              text: '好',
              onPress: () =>
                router.replace({
                  pathname: '/auth/login',
                  params: { email: email.trim() },
                }),
            },
          ]
        );
      }
      // 有 session 的話 root layout 的 auth guard 會自動導向首頁
    } catch (e: any) {
      Alert.alert('註冊失敗', e.message ?? '請稍後再試');
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
