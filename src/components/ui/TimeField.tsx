import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import { Button } from './Button';

interface Props {
  label: string;
  /** 'HH:MM' 或空字串（選填欄位） */
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
}

function toHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

function toDate(hhmm: string): Date {
  const d = new Date(2000, 0, 1, 9, 0);
  if (/^\d{2}:\d{2}/.test(hhmm)) {
    const [h, m] = hhmm.split(':').map(Number);
    d.setHours(h, m);
  }
  return d;
}

export function TimeField({ label, value, onChange, placeholder = '未設定' }: Props) {
  const [show, setShow] = useState(false);
  const pickerValue = toDate(value);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && date) onChange(toHHMM(date));
    } else if (date) {
      onChange(toHHMM(date));
    }
  }

  function closeIOS() {
    if (!value) onChange(toHHMM(pickerValue));
    setShow(false);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.fieldRow}>
        <Pressable
          style={({ pressed }) => [styles.field, pressed && styles.pressed]}
          onPress={() => setShow(true)}
        >
          <Text style={value ? styles.value : styles.placeholder}>
            {value || placeholder}
          </Text>
          <Text style={styles.icon}>🕐</Text>
        </Pressable>
        {value ? (
          <Pressable style={styles.clear} onPress={() => onChange('')} hitSlop={8}>
            <Text style={styles.clearText}>清除</Text>
          </Pressable>
        ) : null}
      </View>

      {Platform.OS === 'android' && show ? (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          is24Hour
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="fade" onRequestClose={closeIOS}>
          <Pressable style={styles.backdrop} onPress={closeIOS}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <DateTimePicker
                value={pickerValue}
                mode="time"
                display="spinner"
                locale="zh-Hant"
                themeVariant="light"
                onChange={handleChange}
              />
              <Button title="完成" onPress={closeIOS} style={styles.doneButton} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16, flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.7 },
  value: { fontSize: 16, color: COLORS.text },
  placeholder: { fontSize: 16, color: COLORS.textSecondary },
  icon: { fontSize: 14 },
  clear: { paddingHorizontal: 4 },
  clearText: { color: COLORS.danger, fontSize: 13 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 12,
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  doneButton: { alignSelf: 'stretch', marginHorizontal: 8, marginTop: 4 },
});
