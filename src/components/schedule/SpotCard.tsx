import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from '../../types/database';
import {
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
  CATEGORY_EMOJI,
  COLORS,
  PRIORITY_COLOR,
} from '../../utils/constants';
import { formatTime } from '../../utils/date';
import { Badge } from '../ui/Badge';

interface Props {
  spot: Spot;
  onPress: () => void;
  onLongPress?: () => void;
  isDragging?: boolean;
}

export function SpotCard({ spot, onPress, onLongPress, isDragging }: Props) {
  const arrival = formatTime(spot.arrival_time);
  const departure = formatTime(spot.departure_time);
  const timeLabel =
    arrival && departure ? `${arrival} – ${departure}` : arrival || departure || '';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        isDragging && styles.dragging,
      ]}
    >
      <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLOR[spot.priority] }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>{CATEGORY_EMOJI[spot.category]}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {spot.name}
          </Text>
          {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
        </View>
        <View style={styles.metaRow}>
          {spot.duration_note ? (
            <Text style={styles.meta}>⏱ {spot.duration_note}</Text>
          ) : null}
          {spot.booking_status !== 'none' ? (
            <Badge
              label={BOOKING_STATUS_LABEL[spot.booking_status]}
              color={BOOKING_STATUS_COLOR[spot.booking_status]}
            />
          ) : null}
          {spot.est_cost_per_person != null ? (
            <Text style={styles.meta}>
              💴 {spot.est_cost_per_person} {spot.cost_currency ?? ''}/人
            </Text>
          ) : null}
        </View>
        {spot.opening_hours_note ? (
          <Text style={styles.hours} numberOfLines={1}>
            🕐 {spot.opening_hours_note}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: { opacity: 0.85 },
  dragging: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  priorityBar: { width: 4 },
  body: { flex: 1, padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emoji: { fontSize: 16 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text },
  time: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  hours: { fontSize: 12, color: COLORS.warning, marginTop: 4 },
});
