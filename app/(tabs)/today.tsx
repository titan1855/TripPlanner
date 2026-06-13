import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlternativeStack } from '../../src/components/schedule/AlternativeStack';
import { ActionMenu, type ActionItem } from '../../src/components/today/ActionMenu';
import { CurrentSpotCard } from '../../src/components/today/CurrentSpotCard';
import { TodaySpotRow } from '../../src/components/today/TodaySpotRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useTodayTrip } from '../../src/hooks/useTodayTrip';
import { openGoogleMapsNavigation } from '../../src/lib/navigation';
import type { Spot } from '../../src/types/database';
import { COLORS } from '../../src/utils/constants';
import { daysUntil, formatDateLabel, formatFullDate } from '../../src/utils/date';

type DayItem =
  | { key: string; type: 'single'; spot: Spot }
  | { key: string; type: 'stack'; spots: Spot[] };

function buildItems(daySpots: Spot[]): DayItem[] {
  const items: DayItem[] = [];
  const seen = new Set<string>();
  for (const spot of daySpots) {
    if (spot.alternative_group) {
      if (seen.has(spot.alternative_group)) continue;
      seen.add(spot.alternative_group);
      items.push({
        key: `g-${spot.alternative_group}`,
        type: 'stack',
        spots: daySpots.filter((s) => s.alternative_group === spot.alternative_group),
      });
    } else {
      items.push({ key: spot.id, type: 'single', spot });
    }
  }
  return items;
}

export default function TodayScreen() {
  const router = useRouter();
  const {
    online,
    status,
    fromCache,
    pending,
    trip,
    days,
    spots,
    upcomingTrip,
    todayDate,
    reload,
    applySpotPatches,
  } = useTodayTrip();
  const [menuTarget, setMenuTarget] = useState<Spot | null>(null);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const today = days.find((d) => d.date === todayDate) ?? null;

  const items = useMemo(() => {
    if (!today) return [];
    const daySpots = spots
      .filter((s) => s.trip_day_id === today.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    return buildItems(daySpots);
  }, [spots, today]);

  // 當前站 = 第一個「未完成的單站」或「候選組」
  const currentIndex = items.findIndex(
    (it) => it.type === 'stack' || it.spot.visit_status === 'pending'
  );
  const nextPreviewIndex = items.findIndex(
    (it, i) => i > currentIndex && it.type === 'single' && it.spot.visit_status === 'pending'
  );

  const nextDay = today
    ? days.find((d) => d.day_number === today.day_number + 1) ?? null
    : null;

  function complete(spot: Spot) {
    applySpotPatches([{ spotId: spot.id, patch: { visit_status: 'done' } }]);
  }
  function skip(spot: Spot) {
    applySpotPatches([{ spotId: spot.id, patch: { visit_status: 'skipped' } }]);
  }
  function undo(spot: Spot) {
    applySpotPatches([{ spotId: spot.id, patch: { visit_status: 'pending' } }]);
  }
  function moveToTomorrow(spot: Spot) {
    if (!nextDay) return;
    const maxSort = spots
      .filter((s) => s.trip_day_id === nextDay.id)
      .reduce((m, s) => Math.max(m, s.sort_order), -1);
    applySpotPatches([
      {
        spotId: spot.id,
        patch: {
          trip_day_id: nextDay.id,
          sort_order: maxSort + 1,
          visit_status: 'pending',
        },
      },
    ]);
  }
  function backToPocket(spot: Spot) {
    applySpotPatches([
      {
        spotId: spot.id,
        patch: {
          trip_day_id: null,
          sort_order: 0,
          alternative_group: null,
          visit_status: 'pending',
        },
      },
    ]);
  }
  function chooseAlternative(chosen: Spot, group: Spot[]) {
    applySpotPatches(
      group.map((s) =>
        s.id === chosen.id
          ? { spotId: s.id, patch: { alternative_group: null } }
          : {
              spotId: s.id,
              patch: {
                trip_day_id: null,
                sort_order: 0,
                alternative_group: null,
                visit_status: 'pending' as const,
              },
            }
      )
    );
  }
  function navigate(spot: Spot) {
    openGoogleMapsNavigation(spot, trip?.destination ?? undefined);
  }

  function menuActions(spot: Spot): ActionItem[] {
    if (spot.visit_status !== 'pending') {
      return [
        { label: '復原為未完成', emoji: '↩️', onPress: () => undo(spot) },
        { label: '退回口袋名單', emoji: '👜', onPress: () => backToPocket(spot) },
      ];
    }
    return [
      { label: '跳過這站', emoji: '⏭️', onPress: () => skip(spot) },
      {
        label: '移到明天',
        emoji: '📆',
        onPress: () => moveToTomorrow(spot),
        disabled: !nextDay,
        disabledHint: '今天是最後一天',
      },
      { label: '退回口袋名單', emoji: '👜', onPress: () => backToPocket(spot) },
    ];
  }

  // ---------- 載入 / 無進行中行程 ----------
  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (status === 'no-active' || !trip || !today) {
    return (
      <View style={styles.container}>
        {!online ? <OfflineBar pending={pending} /> : null}
        {upcomingTrip ? (
          <EmptyState
            emoji="✈️"
            title={`距離「${upcomingTrip.title}」出發`}
            subtitle={`還有 ${daysUntil(upcomingTrip.start_date)} 天（${formatFullDate(
              upcomingTrip.start_date
            )}）\n出發當天這裡會自動切換成今日模式`}
            actionTitle="看這趟行程"
            onAction={() => router.push(`/trip/${upcomingTrip.id}`)}
          />
        ) : !trip ? (
          <EmptyState
            emoji="📍"
            title="目前沒有進行中的行程"
            subtitle="行程到了出發日期，或手動把狀態改成「旅行中」，今天該去哪就會出現在這裡"
          />
        ) : (
          <EmptyState
            emoji="🗓"
            title="今天不在行程日期範圍內"
            subtitle={`「${trip.title}」的行程日期沒有涵蓋今天`}
          />
        )}
      </View>
    );
  }

  const allResolved =
    items.length > 0 && items.every((it) => it.type === 'single' && it.spot.visit_status !== 'pending');

  return (
    <View style={styles.container}>
      {!online || pending > 0 ? <OfflineBar online={online} pending={pending} /> : null}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.dayNumber}>Day {today.day_number}</Text>
          <Text style={styles.date}>{formatDateLabel(today.date)}</Text>
          {today.area_summary ? (
            <Text style={styles.area}>{today.area_summary}</Text>
          ) : null}
          {fromCache ? <Text style={styles.cacheNote}>顯示快取資料</Text> : null}
        </View>

        {today.highlight ? (
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>★ {today.highlight}</Text>
          </View>
        ) : null}

        {items.length === 0 ? (
          <EmptyState
            emoji="🗓"
            title="今天還沒排景點"
            subtitle="到排程頁把口袋名單的地方加進來吧"
            actionTitle="去排程"
            onAction={() => router.push({ pathname: `/trip/${trip.id}/schedule`, params: { day: today.id } })}
          />
        ) : allResolved ? (
          <View style={styles.doneBox}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>今天的行程都完成了！</Text>
            <Text style={styles.doneSub}>辛苦了，好好休息</Text>
          </View>
        ) : null}

        {items.map((item, index) => {
          if (item.type === 'stack') {
            return (
              <View key={item.key} style={styles.itemGap}>
                <AlternativeStack
                  spots={item.spots}
                  onPressSpot={(s) => router.push(`/trip/${trip.id}/spot/${s.id}`)}
                  onChoose={(s) => chooseAlternative(s, item.spots)}
                />
              </View>
            );
          }
          const spot = item.spot;
          if (spot.visit_status !== 'pending') {
            return (
              <TodaySpotRow
                key={item.key}
                spot={spot}
                variant={spot.visit_status === 'done' ? 'done' : 'skipped'}
                onPress={() => setMenuTarget(spot)}
              />
            );
          }
          if (index === currentIndex) {
            return (
              <CurrentSpotCard
                key={item.key}
                spot={spot}
                onNavigate={() => navigate(spot)}
                onComplete={() => complete(spot)}
                onMore={() => setMenuTarget(spot)}
              />
            );
          }
          return (
            <TodaySpotRow
              key={item.key}
              spot={spot}
              variant={index === nextPreviewIndex ? 'next' : 'upcoming'}
              onPress={() => setMenuTarget(spot)}
            />
          );
        })}

        <Pressable
          style={styles.scheduleLink}
          onPress={() =>
            router.push({ pathname: `/trip/${trip.id}/schedule`, params: { day: today.id } })
          }
        >
          <Text style={styles.scheduleLinkText}>看完整排程 ›</Text>
        </Pressable>
      </ScrollView>

      <ActionMenu
        visible={!!menuTarget}
        title={menuTarget?.name ?? ''}
        actions={menuTarget ? menuActions(menuTarget) : []}
        onClose={() => setMenuTarget(null)}
      />
    </View>
  );
}

function OfflineBar({ online = false, pending = 0 }: { online?: boolean; pending?: number }) {
  const label = !online
    ? pending > 0
      ? `離線模式・${pending} 筆變更待同步`
      : '離線模式（顯示已下載的行程）'
    : `${pending} 筆變更同步中…`;
  return (
    <View style={[styles.offlineBar, online && styles.syncBar]}>
      <Text style={styles.offlineText}>{online ? '🔄 ' : '📡 '}{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  content: { padding: 16, paddingBottom: 32 },
  offlineBar: {
    backgroundColor: COLORS.textSecondary,
    paddingVertical: 6,
    alignItems: 'center',
  },
  syncBar: { backgroundColor: COLORS.primary },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  header: { marginBottom: 12 },
  dayNumber: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  date: { fontSize: 16, color: COLORS.textSecondary, marginTop: 2 },
  area: { fontSize: 15, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  cacheNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  highlightBox: {
    backgroundColor: `${COLORS.warning}1A`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  highlightText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  itemGap: { marginBottom: 10 },
  doneBox: { alignItems: 'center', paddingVertical: 32 },
  doneEmoji: { fontSize: 56 },
  doneTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  doneSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  scheduleLink: { alignItems: 'center', paddingVertical: 16 },
  scheduleLinkText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
});
