import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import type { Trip } from '../../types/database';
import { COLORS } from '../../utils/constants';
import { eachDateOfRange, tripDayCount } from '../../utils/date';
import { Button } from '../ui/Button';
import { DateField } from '../ui/DateField';
import { Input } from '../ui/Input';

export interface TripFormValues {
  title: string;
  destination: string | null;
  start_date: string;
  end_date: string;
  key_reminders: string | null;
}

interface Props {
  initial?: Trip;
  submitTitle: string;
  onSubmit: (values: TripFormValues) => Promise<void>;
}

export function TripForm({ initial, submitTitle, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [destination, setDestination] = useState(initial?.destination ?? '');
  const [startDate, setStartDate] = useState(initial?.start_date ?? '');
  const [endDate, setEndDate] = useState(initial?.end_date ?? '');
  const [keyReminders, setKeyReminders] = useState(initial?.key_reminders ?? '');
  const [loading, setLoading] = useState(false);

  const validRange = !!startDate && !!endDate && startDate <= endDate;

  function handleStartChange(iso: string) {
    setStartDate(iso);
    // 出發日晚於回程日時，自動把回程日推到同一天
    if (endDate && endDate < iso) setEndDate(iso);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('請輸入行程標題');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('請選擇出發日與回程日');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('回程日不可早於出發日');
      return;
    }
    if (eachDateOfRange(startDate, endDate).length > 60) {
      Alert.alert('行程過長', '單一行程最多 60 天');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        destination: destination.trim() || null,
        start_date: startDate,
        end_date: endDate,
        key_reminders: keyReminders.trim() || null,
      });
    } catch (e: any) {
      Alert.alert('儲存失敗', e.message ?? '請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Input
        label="行程標題 *"
        value={title}
        onChangeText={setTitle}
        placeholder="例：東京・富士・伊豆 10 日"
      />
      <Input
        label="目的地"
        value={destination}
        onChangeText={setDestination}
        placeholder="例：東京・富士・伊豆"
      />
      <DateField label="出發日 *" value={startDate} onChange={handleStartChange} />
      <DateField
        label="回程日 *"
        value={endDate}
        onChange={setEndDate}
        minimumDate={startDate || undefined}
      />
      {validRange ? (
        <Text style={styles.dayCount}>共 {tripDayCount(startDate, endDate)} 天</Text>
      ) : null}
      <Input
        label="核心提醒"
        value={keyReminders}
        onChangeText={setKeyReminders}
        placeholder="例：租車、teamLab、駕照日文譯本"
        multiline
        style={styles.multiline}
      />
      <Button title={submitTitle} onPress={handleSubmit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48 },
  dayCount: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    marginTop: -8,
    marginBottom: 16,
  },
  multiline: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
});
