import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from '../../types/database';
import {
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
  COLORS,
  TRANSPORT_MODE_EMOJI,
} from '../../utils/constants';

interface Props {
  /** 交通資訊屬於「上一站」spot 的 transport_* 欄位 */
  spot: Spot;
  onPress: () => void;
}

export function hasTransportInfo(spot: Spot): boolean {
  return !!(
    spot.transport_mode ||
    spot.transport_line ||
    spot.transport_departures ||
    spot.transport_minutes
  );
}

export function TransportBar({ spot, onPress }: Props) {
  const parts: string[] = [];
  if (spot.transport_line) parts.push(spot.transport_line);
  if (spot.transport_departures) parts.push(spot.transport_departures);
  if (spot.transport_minutes != null) parts.push(`${spot.transport_minutes} 分`);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.line} />
      <View style={styles.content}>
        <Text style={styles.emoji}>
          {spot.transport_mode ? TRANSPORT_MODE_EMOJI[spot.transport_mode] : '➡️'}
        </Text>
        <Text style={styles.text} numberOfLines={1}>
          {parts.join(' ・ ') || '交通方式'}
        </Text>
        {spot.transport_booking_status === 'need_booking' ? (
          <Text style={[styles.bookingTag, { color: BOOKING_STATUS_COLOR.need_booking }]}>
            {BOOKING_STATUS_LABEL.need_booking}
          </Text>
        ) : null}
      </View>
      {spot.transport_frequency_note ? (
        <Text style={styles.frequency} numberOfLines={1}>
          {spot.transport_frequency_note}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 2, paddingLeft: 18 },
  pressed: { opacity: 0.7 },
  line: {
    position: 'absolute',
    left: 24,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 14,
  },
  emoji: { fontSize: 14 },
  text: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  bookingTag: { fontSize: 12, fontWeight: '700' },
  frequency: {
    fontSize: 11,
    color: COLORS.textSecondary,
    paddingLeft: 34,
    paddingBottom: 4,
  },
});
