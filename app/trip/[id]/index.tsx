import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { appAlert } from '../../../src/lib/dialog';
import { DayOverviewRow } from '../../../src/components/trip/DayOverviewRow';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import {
  accommodationForDate,
  listAccommodations,
} from '../../../src/services/accommodations';
import { countUrgentTodos } from '../../../src/services/checklist';
import { listDays } from '../../../src/services/days';
import { countPocketSpots } from '../../../src/services/spots';
import { countUnbookedRequired } from '../../../src/services/tickets';
import { getTrip, updateTrip } from '../../../src/services/trips';
import type { Accommodation, Trip, TripDay } from '../../../src/types/database';
import type { TripStatus } from '../../../src/types/enums';
import {
  COLORS,
  TRIP_STATUS_COLOR,
  TRIP_STATUS_LABEL,
} from '../../../src/utils/constants';
import { formatDateRange, tripDayCount } from '../../../src/utils/date';

const STATUS_ORDER: TripStatus[] = ['planning', 'ongoing', 'completed'];

interface QuickEntry {
  key: string;
  emoji: string;
  label: string;
  badge?: number;
  badgeColor?: string;
}

export default function TripDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDay[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [pocketCount, setPocketCount] = useState(0);
  const [ticketAlertCount, setTicketAlertCount] = useState(0);
  const [checklistAlertCount, setChecklistAlertCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [t, d, a, pocket, tickets, checklist] = await Promise.all([
        getTrip(id),
        listDays(id),
        listAccommodations(id),
        countPocketSpots(id),
        countUnbookedRequired(id),
        countUrgentTodos(id),
      ]);
      setTrip(t);
      setDays(d);
      setAccommodations(a);
      setPocketCount(pocket);
      setTicketAlertCount(tickets);
      setChecklistAlertCount(checklist);
    } catch (e: any) {
      appAlert('載入失敗', e.message ?? '請稍後再試');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function cycleStatus() {
    if (!trip) return;
    const next =
      STATUS_ORDER[(STATUS_ORDER.indexOf(trip.status) + 1) % STATUS_ORDER.length];
    try {
      setTrip(await updateTrip(trip.id, { status: next }));
    } catch (e: any) {
      appAlert('更新失敗', e.message ?? '請稍後再試');
    }
  }

  function openQuickEntry(key: string) {
    if (key === 'pocket') {
      router.push(`/trip/${id}/pocket`);
    } else {
      appAlert('開發中', '這個功能在 Phase 3 推出');
    }
  }

  if (!trip) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const quickEntries: QuickEntry[] = [
    { key: 'pocket', emoji: '👜', label: '口袋名單', badge: pocketCount, badgeColor: COLORS.primary },
    { key: 'tickets', emoji: '🎫', label: '票券', badge: ticketAlertCount, badgeColor: COLORS.danger },
    { key: 'checklist', emoji: '✅', label: '檢查表', badge: checklistAlertCount, badgeColor: COLORS.danger },
    { key: 'accommodations', emoji: '🛏', label: '住宿' },
    { key: 'members', emoji: '👥', label: '旅伴' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: trip.title,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/trip/${trip.id}/edit`)}>
              <Text style={styles.editLink}>編輯</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{trip.title}</Text>
              {trip.destination ? (
                <Text style={styles.destination}>📍 {trip.destination}</Text>
              ) : null}
              <Text style={styles.dates}>
                {formatDateRange(trip.start_date, trip.end_date)} ・{' '}
                {tripDayCount(trip.start_date, trip.end_date)} 天
              </Text>
            </View>
            <Pressable onPress={cycleStatus} hitSlop={8}>
              <Badge
                label={TRIP_STATUS_LABEL[trip.status]}
                color={TRIP_STATUS_COLOR[trip.status]}
              />
            </Pressable>
          </View>
          {trip.key_reminders ? (
            <View style={styles.reminderBox}>
              <Text style={styles.reminderText}>📌 {trip.key_reminders}</Text>
            </View>
          ) : null}
        </Card>

        <View style={styles.quickRow}>
          {quickEntries.map((entry) => (
            <Pressable
              key={entry.key}
              style={styles.quickItem}
              onPress={() => openQuickEntry(entry.key)}
            >
              <View>
                <Text style={styles.quickEmoji}>{entry.emoji}</Text>
                {entry.badge ? (
                  <View style={[styles.quickBadge, { backgroundColor: entry.badgeColor }]}>
                    <Text style={styles.quickBadgeText}>{entry.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.quickLabel}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>每日行程</Text>
        {days.map((day) => (
          <DayOverviewRow
            key={day.id}
            day={day}
            accommodationName={accommodationForDate(accommodations, day.date)?.name}
            onPress={() =>
              router.push({
                pathname: `/trip/${id}/schedule`,
                params: { day: day.id },
              })
            }
          />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  editLink: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerInfo: { flex: 1, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  destination: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  dates: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  reminderBox: {
    marginTop: 12,
    backgroundColor: `${COLORS.warning}14`,
    borderRadius: 10,
    padding: 10,
  },
  reminderText: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickItem: { alignItems: 'center', width: 60 },
  quickEmoji: { fontSize: 26 },
  quickBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  quickLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
});
