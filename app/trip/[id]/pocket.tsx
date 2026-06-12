import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DayPickerModal } from '../../../src/components/schedule/DayPickerModal';
import { PocketItem } from '../../../src/components/pocket/PocketItem';
import { QuickAddBar } from '../../../src/components/pocket/QuickAddBar';
import { Chips } from '../../../src/components/ui/Chips';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { listDays } from '../../../src/services/days';
import { assignToDay, createSpot, listSpots } from '../../../src/services/spots';
import type { Spot, TripDay } from '../../../src/types/database';
import type { SpotCategory, SpotPriority } from '../../../src/types/enums';
import {
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  COLORS,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
} from '../../../src/utils/constants';

const PRIORITY_ORDER: SpotPriority[] = ['must', 'want', 'optional'];

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as SpotCategory[]).map((c) => ({
  value: c,
  label: CATEGORY_LABEL[c],
  emoji: CATEGORY_EMOJI[c],
}));

export default function PocketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [days, setDays] = useState<TripDay[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<SpotCategory | null>(null);
  const [assigning, setAssigning] = useState<Spot | null>(null);

  const load = useCallback(async () => {
    try {
      const [allSpots, allDays] = await Promise.all([listSpots(id), listDays(id)]);
      setSpots(allSpots.filter((s) => s.trip_day_id === null));
      setDays(allDays);
    } catch (e: any) {
      Alert.alert('載入失敗', e.message ?? '請稍後再試');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleQuickAdd(name: string) {
    try {
      await createSpot({ trip_id: id, name });
      await load();
    } catch (e: any) {
      Alert.alert('新增失敗', e.message ?? '請稍後再試');
    }
  }

  async function handleAssign(day: TripDay) {
    if (!assigning) return;
    try {
      await assignToDay(assigning.id, day.id);
      setAssigning(null);
      await load();
    } catch (e: any) {
      Alert.alert('指派失敗', e.message ?? '請稍後再試');
    }
  }

  const filtered = categoryFilter
    ? spots.filter((s) => s.category === categoryFilter)
    : spots;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <QuickAddBar onAdd={handleQuickAdd} />
        <View style={styles.filterRow}>
          <Chips
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={setCategoryFilter}
            allowDeselect
            onDeselect={() => setCategoryFilter(null)}
          />
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            emoji="👜"
            title={spots.length === 0 ? '口袋還是空的' : '這個分類沒有景點'}
            subtitle={
              spots.length === 0
                ? '把想去的地方都丟進來，之後再慢慢排進每一天'
                : undefined
            }
          />
        ) : (
          PRIORITY_ORDER.map((priority) => {
            const group = filtered.filter((s) => s.priority === priority);
            if (group.length === 0) return null;
            return (
              <View key={priority} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[styles.dot, { backgroundColor: PRIORITY_COLOR[priority] }]}
                  />
                  <Text style={styles.sectionTitle}>
                    {PRIORITY_LABEL[priority]}（{group.length}）
                  </Text>
                </View>
                {group.map((spot) => (
                  <PocketItem
                    key={spot.id}
                    spot={spot}
                    onPress={() => router.push(`/trip/${id}/spot/${spot.id}`)}
                    onAssign={() => setAssigning(spot)}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      <DayPickerModal
        visible={!!assigning}
        days={days}
        title={assigning ? `「${assigning.name}」排到哪一天？` : ''}
        onSelect={handleAssign}
        onClose={() => setAssigning(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48, flexGrow: 1 },
  filterRow: { marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
});
