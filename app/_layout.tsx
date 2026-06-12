import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../src/store/auth';
import { COLORS } from '../src/utils/constants';

export default function RootLayout() {
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const initialize = useAuthStore((s) => s.initialize);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auth guard：未登入導向 login，已登入離開 auth 群組
  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!session && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [initialized, session, segments, router]);

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Stack
        screenOptions={{
          headerTintColor: COLORS.primary,
          headerTitleStyle: { color: COLORS.text },
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="trip/new" options={{ title: '建立行程', presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/index" options={{ title: '行程總覽' }} />
        <Stack.Screen name="trip/[id]/edit" options={{ title: '編輯行程', presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/pocket" options={{ title: '口袋名單' }} />
        <Stack.Screen name="trip/[id]/schedule" options={{ title: '分天排程' }} />
        <Stack.Screen name="trip/[id]/spot/[spotId]" options={{ title: '景點詳情' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
