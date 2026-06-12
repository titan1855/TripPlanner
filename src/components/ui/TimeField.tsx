import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// @ts-expect-error react-native-web 內部 API，用來渲染原生 DOM <input>
import { unstable_createElement } from 'react-native-web';
import { COLORS } from '../../utils/constants';

interface Props {
  label: string;
  /** 'HH:MM' 或空字串（選填欄位） */
  value: string;
  onChange: (time: string) => void;
}

/** HTML <input type="time">：手機上會跳系統時間滾輪 */
export function TimeField({ label, value, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {value ? (
          <Pressable onPress={() => onChange('')} hitSlop={8}>
            <Text style={styles.clearText}>清除</Text>
          </Pressable>
        ) : null}
      </View>
      {unstable_createElement('input', {
        type: 'time',
        value,
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        style: styles.input,
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16, flex: 1 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  clearText: { color: COLORS.danger, fontSize: 13 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'solid',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
    fontFamily: 'inherit',
    appearance: 'none',
  } as any,
});
