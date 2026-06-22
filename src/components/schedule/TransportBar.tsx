import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from '../../types/database';
import {
  legSummary,
  transportLegs,
  transportNeedsBooking,
} from '../../lib/transport';
import {
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
  COLORS,
} from '../../utils/constants';

interface Props {
  /** 交通資訊屬於「上一站」spot 的 transport_legs */
  spot: Spot;
  onPress: () => void;
}

export { hasTransportInfo } from '../../lib/transport';

export function TransportBar({ spot, onPress }: Props) {
  const legs = transportLegs(spot);
  const needsBooking = transportNeedsBooking(spot);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.line} />
      <View style={styles.content}>
        <View style={styles.legs}>
          {legs.length === 0 ? (
            <Text style={styles.text} numberOfLines={1}>
              ➡️ 交通方式
            </Text>
          ) : (
            legs.map((leg, i) => (
              <View key={i} style={styles.legRow}>
                <Text style={styles.text} numberOfLines={1}>
                  {legSummary(leg)}
                </Text>
                {leg.frequency_note ? (
                  <Text style={styles.frequency} numberOfLines={1}>
                    {leg.frequency_note}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
        {needsBooking ? (
          <Text style={[styles.bookingTag, { color: BOOKING_STATUS_COLOR.need_booking }]}>
            {BOOKING_STATUS_LABEL.need_booking}
          </Text>
        ) : null}
      </View>
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
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 14,
  },
  legs: { flex: 1, gap: 2 },
  legRow: { flexDirection: 'column' },
  text: { fontSize: 13, color: COLORS.textSecondary },
  bookingTag: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  frequency: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
