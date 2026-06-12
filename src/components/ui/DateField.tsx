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
import { formatFullDate, parseDate, toISODate, todayISO } from '../../utils/date';
import { Button } from './Button';

interface Props {
  label: string;
  /** ISO 日期字串（YYYY-MM-DD）或空字串 */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  /** 可選的最早日期（ISO），如回程日不可早於出發日 */
  minimumDate?: string;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = '點擊選擇日期',
  minimumDate,
}: Props) {
  const [show, setShow] = useState(false);
  const pickerValue = value ? parseDate(value) : parseDate(minimumDate || todayISO());

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && date) onChange(toISODate(date));
    } else if (date) {
      onChange(toISODate(date));
    }
  }

  function closeIOS() {
    // 開了日曆但沒點任何日期就按完成 → 採用目前顯示的預設日期
    if (!value) onChange(toISODate(pickerValue));
    setShow(false);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
        onPress={() => setShow(true)}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatFullDate(value) : placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </Pressable>

      {Platform.OS === 'android' && show ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="calendar"
          minimumDate={minimumDate ? parseDate(minimumDate) : undefined}
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={show}
          transparent
          animationType="fade"
          onRequestClose={closeIOS}
        >
          <Pressable style={styles.backdrop} onPress={closeIOS}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="inline"
                locale="zh-Hant"
                themeVariant="light"
                accentColor={COLORS.primary}
                minimumDate={minimumDate ? parseDate(minimumDate) : undefined}
                onChange={handleChange}
                style={styles.picker}
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
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  field: {
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
  icon: { fontSize: 16 },
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
  // iOS inline 日曆原生寬度約 320pt，窄於此內容會向右偏移
  picker: { width: 320, alignSelf: 'center' },
  doneButton: { alignSelf: 'stretch', marginHorizontal: 8, marginTop: 4 },
});
