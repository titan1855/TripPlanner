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
import { Badge } from '../ui/Badge';

interface Props {
  spot: Spot;
  onPress: () => void;
  onAssign: () => void;
}

export function PocketItem({ spot, onPress, onAssign }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLOR[spot.priority] }]} />
      <Text style={styles.emoji}>{CATEGORY_EMOJI[spot.category]}</Text>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {spot.name}
        </Text>
        <View style={styles.metaRow}>
          {spot.booking_status !== 'none' ? (
            <Badge
              label={BOOKING_STATUS_LABEL[spot.booking_status]}
              color={BOOKING_STATUS_COLOR[spot.booking_status]}
            />
          ) : null}
          {spot.notes ? (
            <Text style={styles.notes} numberOfLines={1}>
              {spot.notes}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable style={styles.assignButton} onPress={onAssign} hitSlop={6}>
        <Text style={styles.assignText}>排入</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 8,
    paddingRight: 12,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  priorityBar: { width: 4, alignSelf: 'stretch' },
  emoji: { fontSize: 20, marginLeft: 10 },
  info: { flex: 1, paddingVertical: 12, paddingHorizontal: 10 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  notes: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  assignButton: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
});
