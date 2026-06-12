import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { TripDay } from '../../types/database';
import { COLORS } from '../../utils/constants';
import { formatDateLabel } from '../../utils/date';

interface Props {
  visible: boolean;
  days: TripDay[];
  title?: string;
  onSelect: (day: TripDay) => void;
  onClose: () => void;
}

export function DayPickerModal({
  visible,
  days,
  title = '排到哪一天？',
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={days}
            keyExtractor={(d) => d.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.dayNumber}>Day {item.day_number}</Text>
                <Text style={styles.date}>{formatDateLabel(item.date)}</Text>
                {item.area_summary ? (
                  <Text style={styles.area} numberOfLines={1}>
                    {item.area_summary}
                  </Text>
                ) : null}
              </Pressable>
            )}
          />
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
    maxHeight: '70%',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  list: { marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  pressed: { opacity: 0.8 },
  dayNumber: { fontSize: 15, fontWeight: '700', color: COLORS.primary, width: 64 },
  date: { fontSize: 14, color: COLORS.textSecondary, width: 90 },
  area: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
});
