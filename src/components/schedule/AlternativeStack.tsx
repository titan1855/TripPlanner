import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from '../../types/database';
import { COLORS } from '../../utils/constants';
import { SpotCard } from './SpotCard';
import { TransportBar, hasTransportInfo } from './TransportBar';

interface Props {
  spots: Spot[];
  onPressSpot: (spot: Spot) => void;
  onChoose: (spot: Spot) => void;
}

/** 同 alternative_group 的候選方案組：堆疊顯示「N 選 1」，展開比較與選定 */
export function AlternativeStack({ spots, onPressSpot, onChoose }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.headerText}>
          🔀 候選方案 {spots.length} 選 1
        </Text>
        <Text style={styles.expandIcon}>{expanded ? '▲ 收合' : '▼ 展開比較'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.options}>
          {spots.map((spot) => (
            <View key={spot.id} style={styles.option}>
              <SpotCard spot={spot} onPress={() => onPressSpot(spot)} />
              <Text style={styles.transportCaption}>此案往下一站的交通</Text>
              {hasTransportInfo(spot) ? (
                <TransportBar spot={spot} onPress={() => onPressSpot(spot)} />
              ) : (
                <Pressable style={styles.addTransport} onPress={() => onPressSpot(spot)}>
                  <Text style={styles.addTransportText}>┊ ＋ 交通</Text>
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [styles.chooseButton, pressed && { opacity: 0.8 }]}
                onPress={() => onChoose(spot)}
              >
                <Text style={styles.chooseText}>選定 ✓</Text>
              </Pressable>
            </View>
          ))}
          <Text style={styles.hint}>選定後，其餘候選會自動退回口袋名單</Text>
        </View>
      ) : (
        <Pressable onPress={() => setExpanded(true)}>
          {spots.slice(0, 2).map((spot, i) => (
            <View key={spot.id} style={[styles.preview, i > 0 && styles.previewOverlap]}>
              <SpotCard spot={spot} onPress={() => setExpanded(true)} />
            </View>
          ))}
          {spots.length > 2 ? (
            <Text style={styles.more}>還有 {spots.length - 2} 個候選…</Text>
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: COLORS.warning,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 8,
    backgroundColor: `${COLORS.warning}0A`,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  headerText: { fontSize: 13, fontWeight: '700', color: COLORS.warning },
  expandIcon: { fontSize: 12, color: COLORS.textSecondary },
  options: { gap: 4 },
  option: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  transportCaption: {
    fontSize: 11,
    color: COLORS.textSecondary,
    paddingLeft: 18,
    marginTop: 4,
  },
  addTransport: { paddingLeft: 18, paddingVertical: 2 },
  addTransportText: { fontSize: 12, color: COLORS.border },
  chooseButton: {
    marginTop: 6,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  preview: {},
  previewOverlap: { marginTop: -38, opacity: 0.55, transform: [{ scale: 0.96 }] },
  more: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
});
