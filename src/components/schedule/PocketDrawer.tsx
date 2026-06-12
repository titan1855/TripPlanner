import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Spot } from '../../types/database';
import type { SpotCategory, SpotPriority } from '../../types/enums';
import {
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  COLORS,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
} from '../../utils/constants';
import { Button } from '../ui/Button';
import { Chips } from '../ui/Chips';

interface Props {
  visible: boolean;
  pocketSpots: Spot[];
  dayLabel: string;
  onAddOne: (spot: Spot) => void;
  onAddAlternatives: (spots: Spot[]) => void;
  onClose: () => void;
}

const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABEL) as SpotPriority[]).map((p) => ({
  value: p,
  label: PRIORITY_LABEL[p],
  color: PRIORITY_COLOR[p],
}));

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as SpotCategory[]).map((c) => ({
  value: c,
  label: CATEGORY_LABEL[c],
  emoji: CATEGORY_EMOJI[c],
}));

export function PocketDrawer({
  visible,
  pocketSpots,
  dayLabel,
  onAddOne,
  onAddAlternatives,
  onClose,
}: Props) {
  const [priorityFilter, setPriorityFilter] = useState<SpotPriority | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SpotCategory | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [multiOn, setMultiOn] = useState(false);

  const multiMode = multiOn || selected.size > 0;

  const filtered = pocketSpots.filter(
    (s) =>
      (!priorityFilter || s.priority === priorityFilter) &&
      (!categoryFilter || s.category === categoryFilter)
  );

  function toggleSelect(spot: Spot) {
    const next = new Set(selected);
    if (next.has(spot.id)) next.delete(spot.id);
    else next.add(spot.id);
    setSelected(next);
  }

  function handleClose() {
    setSelected(new Set());
    setMultiOn(false);
    onClose();
  }

  function handleAddAlternatives() {
    const spots = pocketSpots.filter((s) => selected.has(s.id));
    setSelected(new Set());
    setMultiOn(false);
    onAddAlternatives(spots);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>從口袋名單加入 {dayLabel}</Text>
            <Pressable
              style={[styles.multiToggle, multiMode && styles.multiToggleOn]}
              onPress={() => {
                if (multiMode) {
                  setSelected(new Set());
                  setMultiOn(false);
                } else {
                  setMultiOn(true);
                }
              }}
            >
              <Text style={[styles.multiToggleText, multiMode && styles.multiToggleTextOn]}>
                {multiMode ? '取消多選' : '☑️ 多選'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            {multiMode
              ? '勾選 2 個以上，加入為「候選方案組（N 選 1）」'
              : '點一下直接加入；按「多選」可把幾個地點綁成候選方案組'}
          </Text>

          <View style={styles.filters}>
            <Chips
              options={PRIORITY_OPTIONS}
              value={priorityFilter}
              onChange={setPriorityFilter}
              allowDeselect
              onDeselect={() => setPriorityFilter(null)}
            />
            <Chips
              options={CATEGORY_OPTIONS}
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowDeselect
              onDeselect={() => setCategoryFilter(null)}
            />
          </View>

          {filtered.length === 0 ? (
            <Text style={styles.empty}>
              {pocketSpots.length === 0
                ? '口袋名單是空的，先去「口袋名單」頁加一些想去的地方吧'
                : '沒有符合篩選的景點'}
            </Text>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(s) => s.id}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = selected.has(item.id);
                return (
                  <Pressable
                    onPress={() => (multiMode ? toggleSelect(item) : onAddOne(item))}
                    onLongPress={() => toggleSelect(item)}
                    delayLongPress={200}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.pressed,
                      isSelected && styles.rowSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: PRIORITY_COLOR[item.priority] },
                      ]}
                    />
                    <Text style={styles.emoji}>{CATEGORY_EMOJI[item.category]}</Text>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.action}>
                      {multiMode ? (isSelected ? '☑️' : '⬜️') : '＋'}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          {multiMode ? (
            <View style={styles.footer}>
              <Button
                title={`加入為候選組（${selected.size} 選 1）`}
                onPress={handleAddAlternatives}
                disabled={selected.size < 2}
              />
              <Button
                title="取消選取"
                variant="ghost"
                onPress={() => setSelected(new Set())}
              />
            </View>
          ) : null}
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
    maxHeight: '80%',
    minHeight: '50%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  multiToggle: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  multiToggleOn: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}14` },
  multiToggleText: { fontSize: 13, color: COLORS.textSecondary },
  multiToggleTextOn: { color: COLORS.primary, fontWeight: '600' },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  filters: { gap: 8, marginBottom: 12 },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingVertical: 32,
    lineHeight: 22,
  },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  pressed: { opacity: 0.8 },
  rowSelected: { borderWidth: 1.5, borderColor: COLORS.primary },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  emoji: { fontSize: 16 },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  action: { fontSize: 18, color: COLORS.primary },
  footer: { marginTop: 8, gap: 4 },
});
