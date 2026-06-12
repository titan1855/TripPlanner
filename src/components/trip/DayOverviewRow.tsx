import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TripDay } from '../../types/database';
import { COLORS } from '../../utils/constants';
import { formatDateLabel } from '../../utils/date';

interface Props {
  day: TripDay;
  /** 由 accommodations 日期區間對應出的當晚住宿名稱 */
  accommodationName?: string | null;
  onPress: () => void;
}

export function DayOverviewRow({ day, accommodationName, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.dayCol}>
        <Text style={styles.dayNumber}>Day {day.day_number}</Text>
        <Text style={styles.date}>{formatDateLabel(day.date)}</Text>
      </View>
      <View style={styles.infoCol}>
        {day.area_summary ? (
          <Text style={styles.area} numberOfLines={1}>
            {day.area_summary}
          </Text>
        ) : (
          <Text style={styles.placeholder}>尚未規劃</Text>
        )}
        {day.highlight ? (
          <Text style={styles.highlight} numberOfLines={1}>
            ★ {day.highlight}
          </Text>
        ) : null}
        {accommodationName ? (
          <Text style={styles.hotel} numberOfLines={1}>
            🛏 {accommodationName}
          </Text>
        ) : null}
      </View>
      {day.plan_b ? <Text style={styles.planB}>☂️</Text> : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  pressed: { opacity: 0.85 },
  dayCol: { width: 76 },
  dayNumber: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  date: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  infoCol: { flex: 1, marginLeft: 8 },
  area: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  placeholder: { fontSize: 14, color: COLORS.border },
  highlight: { fontSize: 13, color: COLORS.warning, marginTop: 2 },
  hotel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  planB: { fontSize: 16, marginRight: 4 },
  chevron: { fontSize: 22, color: COLORS.border, marginLeft: 4 },
});
