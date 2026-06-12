import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
// @ts-expect-error react-native-web 內部 API，用來渲染原生 DOM <input>
import { unstable_createElement } from 'react-native-web';
import { COLORS } from '../../utils/constants';

interface Props {
  label: string;
  /** ISO 日期字串（YYYY-MM-DD）或空字串 */
  value: string;
  onChange: (iso: string) => void;
  /** 可選的最早日期（ISO），如回程日不可早於出發日 */
  minimumDate?: string;
}

/** HTML <input type="date">：手機上會跳系統日曆/滾輪，桌面是瀏覽器日曆 */
export function DateField({ label, value, onChange, minimumDate }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {unstable_createElement('input', {
        type: 'date',
        value,
        min: minimumDate || undefined,
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        style: styles.input,
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
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
