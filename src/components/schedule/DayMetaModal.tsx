import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { appAlert } from '../../lib/dialog';
import { updateDay } from '../../services/days';
import type { TripDay } from '../../types/database';
import { COLORS } from '../../utils/constants';
import { formatDateLabel } from '../../utils/date';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Props {
  day: TripDay | null;
  onSaved: (day: TripDay) => void;
  onClose: () => void;
}

export function DayMetaModal({ day, onSaved, onClose }: Props) {
  const [areaSummary, setAreaSummary] = useState('');
  const [highlight, setHighlight] = useState('');
  const [planB, setPlanB] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (day) {
      setAreaSummary(day.area_summary ?? '');
      setHighlight(day.highlight ?? '');
      setPlanB(day.plan_b ?? '');
      setMemo(day.memo ?? '');
    }
  }, [day]);

  async function handleSave() {
    if (!day) return;
    setLoading(true);
    try {
      const updated = await updateDay(day.id, {
        area_summary: areaSummary.trim() || null,
        highlight: highlight.trim() || null,
        plan_b: planB.trim() || null,
        memo: memo.trim() || null,
      });
      onSaved(updated);
    } catch (e: any) {
      appAlert('儲存失敗', e.message ?? '請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={!!day} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>
            Day {day?.day_number}（{day ? formatDateLabel(day.date) : ''}）概要
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
            <Input
              label="主要區域"
              value={areaSummary}
              onChangeText={setAreaSummary}
              placeholder="例：秋葉原・原宿・豐洲"
            />
            <Input
              label="今日重點"
              value={highlight}
              onChangeText={setHighlight}
              placeholder="例：teamLab Planets 16:00"
            />
            <Input
              label="備案 Plan B"
              value={planB}
              onChangeText={setPlanB}
              placeholder="例：下雨改 MOA 美術館"
            />
            <Input
              label="當天備忘"
              value={memo}
              onChangeText={setMemo}
              placeholder="其他想記的事"
            />
            <Button title="儲存" onPress={handleSave} loading={loading} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
});
