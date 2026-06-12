import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../utils/constants';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  emoji?: string;
  color?: string;
}

interface Props<T extends string> {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** 再點一次已選中的 chip 時取消選取（用於選填欄位） */
  allowDeselect?: boolean;
  onDeselect?: () => void;
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  allowDeselect = false,
  onDeselect,
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        const color = opt.color ?? COLORS.primary;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (selected && allowDeselect) onDeselect?.();
              else onChange(opt.value);
            }}
            style={[
              styles.chip,
              selected && { backgroundColor: `${color}1A`, borderColor: color },
            ]}
          >
            <Text style={[styles.text, selected && { color, fontWeight: '700' }]}>
              {opt.emoji ? `${opt.emoji} ` : ''}
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
  },
  text: { fontSize: 14, color: COLORS.textSecondary },
});
