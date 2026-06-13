import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TripCard } from '../../src/components/trip/TripCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { FadeIn } from '../../src/components/ui/FadeIn';
import { listTrips } from '../../src/services/trips';
import type { Trip } from '../../src/types/database';
import { COLORS } from '../../src/utils/constants';

export default function TripListScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrips(await listTrips());
      setError(null);
    } catch (e: any) {
      setError(e.message ?? '載入失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item, index }) => (
          <FadeIn delay={Math.min(index, 6) * 50}>
            <TripCard trip={item} onPress={() => router.push(`/trip/${item.id}`)} />
          </FadeIn>
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="還沒有行程"
              subtitle="建立第一趟旅程，開始把想去的地方都收進口袋吧！"
              actionTitle="＋ 建立行程"
              onAction={() => router.push('/trip/new')}
            />
          )
        }
      />
      {trips.length > 0 ? (
        <Pressable style={styles.fab} onPress={() => router.push('/trip/new')}>
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, flexGrow: 1 },
  error: {
    color: COLORS.danger,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },
});
