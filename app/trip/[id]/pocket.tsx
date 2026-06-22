import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { appAlert } from '../../../src/lib/dialog';
import { DayPickerModal } from '../../../src/components/schedule/DayPickerModal';
import { PocketItem } from '../../../src/components/pocket/PocketItem';
import { QuickAddBar } from '../../../src/components/pocket/QuickAddBar';
import { Button } from '../../../src/components/ui/Button';
import { Chips } from '../../../src/components/ui/Chips';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { listDays } from '../../../src/services/days';
import {
  assignAsAlternatives,
  assignToDay,
  createSpot,
  listSpots,
} from '../../../src/services/spots';
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
  const [multiOn, setMultiOn] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickingGroupDay, setPickingGroupDay] = useState(false);

  const multiMode = multiOn || selected.size > 0;

  function toggleSelect(spot: Spot) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(spot.id)) next.delete(spot.id);
      else next.add(spot.id);
      return next;
    });
  }

  function exitMulti() {
    setSelected(new Set());
    setMultiOn(false);
  }

  const load = useCallback(async () => {
    try {
      const [allSpots, allDays] = await Promise.all([listSpots(id), listDays(id)]);
      setSpots(allSpots.filter((s) => s.trip_day_id === null));
      setDays(allDays);
    } catch (e: any) {
      appAlert('載入失敗', e.message ?? '請稍後再試');
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
      appAlert('新增失敗', e.message ?? '請稍後再試');
    }
  }

  async function handleAssign(day: TripDay) {
    if (!assigning) return;
    try {
      await assignToDay(assigning.id, day.id);
      setAssigning(null);
      await load();
    } catch (e: any) {
      appAlert('指派失敗', e.message ?? '請稍後再試');
    }
  }

  async function handleAssignGroup(day: TripDay) {
    const ids = spots.filter((s) => selected.has(s.id)).map((s) => s.id);
    if (ids.length < 2) return;
    try {
      await assignAsAlternatives(ids, day.id);
      setPickingGroupDay(false);
      exitMulti();
      await load();
    } catch (e: any) {
      appAlert('組候選方案失敗', e.message ?? '請稍後再試');
    }
  }

  const filtered = categoryFilter
    ? spots.filter((s) => s.category === categoryFilter)
    : spots;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <QuickAddBar onAdd={handleQuickAdd} />

        {spots.length > 0 ? (
          <View style={styles.toolbar}>
            <Pressable
              style={[styles.multiToggle, multiMode && styles.multiToggleOn]}
              onPress={() => (multiMode ? exitMulti() : setMultiOn(true))}
            >
              <Text
                style={[styles.multiToggleText, multiMode && styles.multiToggleTextOn]}
              >
                {multiMode ? '取消多選' : '☑️ 組多選景點'}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {multiMode ? (
          <Text style={styles.multiHint}>
            勾選 2 個以上想替換的地點，組成「候選方案組（N 選 1）」排進某天
          </Text>
        ) : null}

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
                    selectMode={multiMode}
                    selected={selected.has(spot.id)}
                    onPress={() =>
                      multiMode
                        ? toggleSelect(spot)
                        : router.push(`/trip/${id}/spot/${spot.id}`)
                    }
                    onAssign={() => setAssigning(spot)}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {multiMode ? (
        <View style={styles.footer}>
          <Button
            title={`組為候選方案組（${selected.size} 選 1）`}
            onPress={() => setPickingGroupDay(true)}
            disabled={selected.size < 2}
          />
          <Button title="取消多選" variant="ghost" onPress={exitMulti} />
        </View>
      ) : null}

      <DayPickerModal
        visible={!!assigning || pickingGroupDay}
        days={days}
        title={
          pickingGroupDay
            ? `把這 ${selected.size} 個景點組成候選方案，排到哪一天？`
            : assigning
            ? `「${assigning.name}」排到哪一天？`
            : ''
        }
        onSelect={pickingGroupDay ? handleAssignGroup : handleAssign}
        onClose={() => {
          setAssigning(null);
          setPickingGroupDay(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48, flexGrow: 1 },
  toolbar: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  multiToggle: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  multiToggleOn: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}14` },
  multiToggleText: { fontSize: 13, color: COLORS.textSecondary },
  multiToggleTextOn: { color: COLORS.primary, fontWeight: '600' },
  multiHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingTop: 8,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterRow: { marginBottom: 16, marginTop: 12 },
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
