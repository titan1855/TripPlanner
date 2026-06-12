import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { AlternativeStack } from '../../../src/components/schedule/AlternativeStack';
import { DayMetaModal } from '../../../src/components/schedule/DayMetaModal';
import { PocketDrawer } from '../../../src/components/schedule/PocketDrawer';
import { SpotCard } from '../../../src/components/schedule/SpotCard';
import {
  TransportBar,
  hasTransportInfo,
} from '../../../src/components/schedule/TransportBar';
import { DayTabs } from '../../../src/components/trip/DayTabs';
import { Button } from '../../../src/components/ui/Button';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { listDays } from '../../../src/services/days';
import {
  assignAsAlternatives,
  assignToDay,
  chooseAlternative,
  listSpots,
  reorderDay,
} from '../../../src/services/spots';
import type { Spot, TripDay } from '../../../src/types/database';
import { COLORS } from '../../../src/utils/constants';

type ListItem =
  | { key: string; type: 'single'; spot: Spot }
  | { key: string; type: 'stack'; spots: Spot[] };

/** 把當天 spots 依 sort_order 排好，同 alternative_group 的合成一個堆疊項 */
function buildListItems(daySpots: Spot[]): ListItem[] {
  const items: ListItem[] = [];
  const seenGroups = new Set<string>();
  for (const spot of daySpots) {
    if (spot.alternative_group) {
      if (seenGroups.has(spot.alternative_group)) continue;
      seenGroups.add(spot.alternative_group);
      const members = daySpots.filter(
        (s) => s.alternative_group === spot.alternative_group
      );
      items.push({ key: `g-${spot.alternative_group}`, type: 'stack', spots: members });
    } else {
      items.push({ key: spot.id, type: 'single', spot });
    }
  }
  return items;
}

function flattenToIds(items: ListItem[]): string[] {
  return items.flatMap((item) =>
    item.type === 'single' ? [item.spot.id] : item.spots.map((s) => s.id)
  );
}

export default function ScheduleScreen() {
  const { id, day: dayParam } = useLocalSearchParams<{ id: string; day?: string }>();
  const router = useRouter();
  const [days, setDays] = useState<TripDay[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [activeDayId, setActiveDayId] = useState<string | null>(dayParam ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<TripDay | null>(null);

  const load = useCallback(async () => {
    try {
      const [allDays, allSpots] = await Promise.all([listDays(id), listSpots(id)]);
      setDays(allDays);
      setSpots(allSpots);
      setActiveDayId((current) => {
        if (current && allDays.some((d) => d.id === current)) return current;
        return allDays[0]?.id ?? null;
      });
    } catch (e: any) {
      Alert.alert('載入失敗', e.message ?? '請稍後再試');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const activeDay = days.find((d) => d.id === activeDayId) ?? null;
  const pocketSpots = spots.filter((s) => s.trip_day_id === null);

  const listItems = useMemo(() => {
    const daySpots = spots
      .filter((s) => s.trip_day_id === activeDayId)
      .sort((a, b) => a.sort_order - b.sort_order);
    return buildListItems(daySpots);
  }, [spots, activeDayId]);

  async function handleDragEnd({ data }: { data: ListItem[] }) {
    const ids = flattenToIds(data);
    // 樂觀更新本地排序
    setSpots((prev) =>
      prev.map((s) => {
        const idx = ids.indexOf(s.id);
        return idx >= 0 ? { ...s, sort_order: idx } : s;
      })
    );
    try {
      await reorderDay(ids);
    } catch (e: any) {
      Alert.alert('排序儲存失敗', e.message ?? '請稍後再試');
      await load();
    }
  }

  async function handleAddOne(spot: Spot) {
    if (!activeDayId) return;
    try {
      await assignToDay(spot.id, activeDayId);
      await load();
    } catch (e: any) {
      Alert.alert('加入失敗', e.message ?? '請稍後再試');
    }
  }

  async function handleAddAlternatives(selected: Spot[]) {
    if (!activeDayId || selected.length < 2) return;
    setDrawerOpen(false);
    try {
      await assignAsAlternatives(
        selected.map((s) => s.id),
        activeDayId
      );
      await load();
    } catch (e: any) {
      Alert.alert('加入失敗', e.message ?? '請稍後再試');
    }
  }

  function handleChoose(spot: Spot) {
    Alert.alert('選定方案', `確定選「${spot.name}」？其餘候選會退回口袋名單。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '選定',
        onPress: async () => {
          try {
            await chooseAlternative(spot);
            await load();
          } catch (e: any) {
            Alert.alert('操作失敗', e.message ?? '請稍後再試');
          }
        },
      },
    ]);
  }

  const openSpot = (spot: Spot) => router.push(`/trip/${id}/spot/${spot.id}`);

  function renderItem({ item, drag, isActive, getIndex }: RenderItemParams<ListItem>) {
    const index = getIndex() ?? 0;
    const isLast = index === listItems.length - 1;
    return (
      <View style={styles.itemWrap}>
        {item.type === 'single' ? (
          <SpotCard
            spot={item.spot}
            onPress={() => openSpot(item.spot)}
            onLongPress={drag}
            isDragging={isActive}
          />
        ) : (
          <AlternativeStack
            spots={item.spots}
            onPressSpot={openSpot}
            onChoose={handleChoose}
            onLongPress={drag}
            isDragging={isActive}
          />
        )}
        {!isLast && item.type === 'single' ? (
          hasTransportInfo(item.spot) ? (
            <TransportBar spot={item.spot} onPress={() => openSpot(item.spot)} />
          ) : (
            <Pressable style={styles.addTransport} onPress={() => openSpot(item.spot)}>
              <Text style={styles.addTransportText}>┊ ＋ 交通</Text>
            </Pressable>
          )
        ) : null}
        {!isLast && item.type === 'stack' ? <View style={styles.stackGap} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DayTabs days={days} activeDayId={activeDayId} onSelect={(d) => setActiveDayId(d.id)} />

      {activeDay ? (
        <Pressable style={styles.dayMeta} onPress={() => setEditingDay(activeDay)}>
          <Text style={styles.dayMetaText} numberOfLines={1}>
            {activeDay.area_summary || '點此填寫當天概要（區域、重點、備案）'}
          </Text>
          {activeDay.highlight ? (
            <Text style={styles.dayHighlight} numberOfLines={1}>
              ★ {activeDay.highlight}
            </Text>
          ) : null}
          <Text style={styles.dayMetaEdit}>✏️</Text>
        </Pressable>
      ) : null}

      {listItems.length === 0 ? (
        <EmptyState
          emoji="🗓"
          title="這天還沒排任何景點"
          subtitle="從口袋名單把想去的地方加進來吧"
          actionTitle="＋ 從口袋名單加入"
          onAction={() => setDrawerOpen(true)}
        />
      ) : (
        <DraggableFlatList
          data={listItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          containerStyle={styles.listContainer}
          contentContainerStyle={styles.listContent}
          activationDistance={8}
        />
      )}

      {listItems.length > 0 ? (
        <View style={styles.footer}>
          <Button title="＋ 從口袋名單加入" onPress={() => setDrawerOpen(true)} />
        </View>
      ) : null}

      <PocketDrawer
        visible={drawerOpen}
        pocketSpots={pocketSpots}
        dayLabel={activeDay ? `Day ${activeDay.day_number}` : ''}
        onAddOne={handleAddOne}
        onAddAlternatives={handleAddAlternatives}
        onClose={() => setDrawerOpen(false)}
      />

      <DayMetaModal
        day={editingDay}
        onSaved={(updated) => {
          setDays((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setEditingDay(null);
        }}
        onClose={() => setEditingDay(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    gap: 8,
  },
  dayMetaText: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  dayHighlight: { fontSize: 12, color: COLORS.warning },
  dayMetaEdit: { fontSize: 14 },
  listContainer: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 24 },
  itemWrap: { marginBottom: 4 },
  addTransport: { paddingLeft: 18, paddingVertical: 4 },
  addTransportText: { fontSize: 12, color: COLORS.border },
  stackGap: { height: 8 },
  footer: { padding: 16, paddingTop: 8 },
});
