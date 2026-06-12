import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuth } from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/store/auth';
import { COLORS } from '../../src/utils/constants';

export default function ProfileScreen() {
  const { profile, session } = useAuth();
  const signOut = useAuthStore((s) => s.signOut);
  const [loading, setLoading] = useState(false);

  function confirmSignOut() {
    Alert.alert('登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '登出',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await signOut();
          } catch (e: any) {
            Alert.alert('登出失敗', e.message ?? '請稍後再試');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.name}>
          {profile?.display_name ?? session?.user.email?.split('@')[0] ?? '旅人'}
        </Text>
        <Text style={styles.email}>{session?.user.email}</Text>
      </Card>
      <Button title="登出" variant="danger" onPress={confirmSignOut} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
});
