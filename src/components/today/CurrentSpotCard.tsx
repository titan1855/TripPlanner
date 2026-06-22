import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from '../../types/database';
import { CATEGORY_EMOJI, COLORS } from '../../utils/constants';
import { legSummary, transportLegs } from '../../lib/transport';
import { formatTime } from '../../utils/date';

interface Props {
  spot: Spot;
  /** 大字大按鈕：當前要去的這一站 */
  onNavigate: () => void;
  onComplete: () => void;
  onMore: () => void;
}

export function CurrentSpotCard({ spot, onNavigate, onComplete, onMore }: Props) {
  const arrival = formatTime(spot.arrival_time);
  const departure = formatTime(spot.departure_time);
  const timeLabel =
    arrival && departure ? `${arrival} – ${departure}` : arrival || departure || '';

  const legs = transportLegs(spot);

  return (
    <View style={styles.card}>
      <Text style={styles.nowLabel}>現在去這裡</Text>
      <View style={styles.titleRow}>
        <Text style={styles.emoji}>{CATEGORY_EMOJI[spot.category]}</Text>
        <Text style={styles.name}>{spot.name}</Text>
      </View>
      {timeLabel ? <Text style={styles.time}>🕐 {timeLabel}</Text> : null}
      {spot.address ? (
        <Text style={styles.address} numberOfLines={2}>
          📍 {spot.address}
        </Text>
      ) : null}
      {spot.duration_note ? (
        <Text style={styles.meta}>停留 {spot.duration_note}</Text>
      ) : null}
      {spot.opening_hours_note ? (
        <Text style={styles.hours}>🕐 {spot.opening_hours_note}</Text>
      ) : null}
      {spot.notes ? <Text style={styles.notes}>{spot.notes}</Text> : null}

      {legs.length > 0 ? (
        <View style={styles.transportBox}>
          <Text style={styles.transportLabel}>往下一站</Text>
          {legs.map((leg, i) => (
            <View key={i}>
              <Text style={styles.transportText}>{legSummary(leg)}</Text>
              {leg.notes ? (
                <Text style={styles.transportNote}>{leg.notes}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={onNavigate}
        >
          <Text style={styles.navText}>🧭 導航</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
          onPress={onComplete}
        >
          <Text style={styles.doneText}>完成 ✓</Text>
        </Pressable>
      </View>
      <Pressable style={styles.moreButton} onPress={onMore} hitSlop={6}>
        <Text style={styles.moreText}>⋯ 跳過 / 移到明天 / 退回口袋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: 16,
  },
  nowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 28 },
  name: { flex: 1, fontSize: 26, fontWeight: '800', color: COLORS.text },
  time: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  address: { fontSize: 15, color: COLORS.textSecondary, marginTop: 6 },
  meta: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  hours: { fontSize: 14, color: COLORS.warning, marginTop: 4 },
  notes: { fontSize: 14, color: COLORS.text, marginTop: 8 },
  transportBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  transportLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  transportText: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginTop: 4 },
  transportNote: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  navButton: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  doneButton: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  pressed: { opacity: 0.85 },
  moreButton: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  moreText: { fontSize: 14, color: COLORS.textSecondary },
});
