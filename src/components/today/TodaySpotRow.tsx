import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from '../../types/database';
import { CATEGORY_EMOJI, COLORS } from '../../utils/constants';
import { formatTime } from '../../utils/date';

interface Props {
  spot: Spot;
  /** 'next' = 下一站預覽（強調）；'upcoming' = 之後；'done' / 'skipped' = 已處理 */
  variant: 'next' | 'upcoming' | 'done' | 'skipped';
  onPress: () => void;
}

export function TodaySpotRow({ spot, variant, onPress }: Props) {
  const resolved = variant === 'done' || variant === 'skipped';
  const arrival = formatTime(spot.arrival_time);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        variant === 'next' && styles.nextRow,
        resolved && styles.resolvedRow,
        pressed && styles.pressed,
      ]}
    >
      {variant === 'next' ? <Text style={styles.nextTag}>下一站</Text> : null}
      <Text style={[styles.emoji, resolved && styles.dim]}>
        {variant === 'done' ? '✅' : variant === 'skipped' ? '⏭️' : CATEGORY_EMOJI[spot.category]}
      </Text>
      <View style={styles.body}>
        <Text
          style={[
            styles.name,
            variant === 'next' && styles.nextName,
            resolved && styles.resolvedName,
          ]}
          numberOfLines={1}
        >
          {spot.name}
        </Text>
        {arrival && !resolved ? <Text style={styles.time}>{arrival}</Text> : null}
        {variant === 'skipped' ? <Text style={styles.skipNote}>已跳過</Text> : null}
      </View>
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
    gap: 10,
  },
  nextRow: { borderWidth: 1.5, borderColor: COLORS.primary },
  resolvedRow: { backgroundColor: 'transparent', paddingVertical: 8 },
  pressed: { opacity: 0.8 },
  nextTag: {
    position: 'absolute',
    top: -8,
    left: 14,
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emoji: { fontSize: 22 },
  dim: { opacity: 0.6 },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  nextName: { fontSize: 18, fontWeight: '700' },
  resolvedName: { color: COLORS.textSecondary, textDecorationLine: 'line-through' },
  time: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  skipNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
