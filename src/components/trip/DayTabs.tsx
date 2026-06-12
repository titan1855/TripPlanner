import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { TripDay } from '../../types/database';
import { COLORS } from '../../utils/constants';
import { formatDateLabel } from '../../utils/date';

interface Props {
  days: TripDay[];
  activeDayId: string | null;
  onSelect: (day: TripDay) => void;
}

export function DayTabs({ days, activeDayId, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const activeIndex = days.findIndex((d) => d.id === activeDayId);

  useEffect(() => {
    if (activeIndex >= 0) {
      scrollRef.current?.scrollTo({ x: Math.max(0, activeIndex * 84 - 100), animated: true });
    }
  }, [activeIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {days.map((day) => {
        const active = day.id === activeDayId;
        return (
          <Pressable
            key={day.id}
            onPress={() => onSelect(day)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.dayNumber, active && styles.textActive]}>
              Day {day.day_number}
            </Text>
            <Text style={[styles.date, active && styles.textActive]}>
              {formatDateLabel(day.date)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 0, backgroundColor: COLORS.card },
  content: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    width: 76,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  tabActive: { backgroundColor: COLORS.primary },
  dayNumber: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  textActive: { color: '#fff' },
});
