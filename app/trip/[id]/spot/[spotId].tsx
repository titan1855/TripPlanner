import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { appAlert, appConfirm } from '../../../../src/lib/dialog';
import { DayPickerModal } from '../../../../src/components/schedule/DayPickerModal';
import { Button } from '../../../../src/components/ui/Button';
import { Chips } from '../../../../src/components/ui/Chips';
import { Input } from '../../../../src/components/ui/Input';
import { TimeField } from '../../../../src/components/ui/TimeField';
import { openGoogleMapsNavigation } from '../../../../src/lib/navigation';
import { listDays } from '../../../../src/services/days';
import {
  assignToDay,
  backToPocket,
  deleteSpot,
  getSpot,
  updateSpot,
} from '../../../../src/services/spots';
import { getTrip } from '../../../../src/services/trips';
import type { Spot, TransportLeg, TripDay } from '../../../../src/types/database';
import { emptyTransportLeg } from '../../../../src/types/database';
import { legHasContent } from '../../../../src/lib/transport';
import type {
  BookingStatus,
  SpotCategory,
  SpotPriority,
  TransportMode,
} from '../../../../src/types/enums';
import {
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  COLORS,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  TRANSPORT_MODE_EMOJI,
  TRANSPORT_MODE_LABEL,
} from '../../../../src/utils/constants';
import { formatTime } from '../../../../src/utils/date';

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as SpotCategory[]).map((c) => ({
  value: c,
  label: CATEGORY_LABEL[c],
  emoji: CATEGORY_EMOJI[c],
}));
const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABEL) as SpotPriority[]).map((p) => ({
  value: p,
  label: PRIORITY_LABEL[p],
  color: PRIORITY_COLOR[p],
}));
const BOOKING_OPTIONS = (Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((b) => ({
  value: b,
  label: BOOKING_STATUS_LABEL[b],
  color: BOOKING_STATUS_COLOR[b],
}));
const TRANSPORT_OPTIONS = (Object.keys(TRANSPORT_MODE_LABEL) as TransportMode[]).map(
  (m) => ({ value: m, label: TRANSPORT_MODE_LABEL[m], emoji: TRANSPORT_MODE_EMOJI[m] })
);

/** 儲存前清理：trim 字串、空字串轉 null、丟掉全空的段 */
function normalizeLegs(legs: TransportLeg[]): TransportLeg[] {
  return legs
    .map((l) => ({
      mode: l.mode,
      line: l.line?.trim() || null,
      departures: l.departures?.trim() || null,
      board_at: l.board_at?.trim() || null,
      alight_at: l.alight_at?.trim() || null,
      minutes: l.minutes,
      frequency_note: l.frequency_note?.trim() || null,
      booking_status: l.booking_status,
      cost_per_person: l.cost_per_person,
      notes: l.notes?.trim() || null,
    }))
    .filter(legHasContent);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function SpotDetailScreen() {
  const { id, spotId } = useLocalSearchParams<{ id: string; spotId: string }>();
  const router = useRouter();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [days, setDays] = useState<TripDay[]>([]);
  const [destinationHint, setDestinationHint] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [pickingDay, setPickingDay] = useState(false);

  // 編輯欄位
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState<SpotCategory>('other');
  const [priority, setPriority] = useState<SpotPriority>('want');
  const [notes, setNotes] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [durationNote, setDurationNote] = useState('');
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('none');
  const [openingHoursNote, setOpeningHoursNote] = useState('');
  const [estCost, setEstCost] = useState('');
  const [costCurrency, setCostCurrency] = useState('');
  const [legs, setLegs] = useState<TransportLeg[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, allDays, trip] = await Promise.all([
          getSpot(spotId),
          listDays(id),
          getTrip(id),
        ]);
        setDays(allDays);
        setDestinationHint(trip.destination ?? undefined);
        setSpot(s);
        setName(s.name);
        setAddress(s.address ?? '');
        setCategory(s.category);
        setPriority(s.priority);
        setNotes(s.notes ?? '');
        setArrivalTime(formatTime(s.arrival_time));
        setDepartureTime(formatTime(s.departure_time));
        setDurationNote(s.duration_note ?? '');
        setBookingStatus(s.booking_status);
        setOpeningHoursNote(s.opening_hours_note ?? '');
        setEstCost(s.est_cost_per_person != null ? String(s.est_cost_per_person) : '');
        setCostCurrency(s.cost_currency ?? '');
        setLegs(s.transport_legs ?? []);
      } catch (e: any) {
        appAlert('載入失敗', e.message ?? '請稍後再試');
      }
    })();
  }, [spotId, id]);

  function parseNumber(text: string): number | null {
    const n = parseFloat(text.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  function updateLeg(index: number, patch: Partial<TransportLeg>) {
    setLegs((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function addLeg() {
    setLegs((prev) => [...prev, emptyTransportLeg()]);
  }
  function removeLeg(index: number) {
    setLegs((prev) => prev.filter((_, i) => i !== index));
  }
  function moveLeg(index: number, dir: -1 | 1) {
    setLegs((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (!spot) return;
    if (!name.trim()) {
      appAlert('請輸入景點名稱');
      return;
    }
    setSaving(true);
    try {
      await updateSpot(spot.id, {
        name: name.trim(),
        address: address.trim() || null,
        category,
        priority,
        notes: notes.trim() || null,
        arrival_time: arrivalTime || null,
        departure_time: departureTime || null,
        duration_note: durationNote.trim() || null,
        booking_status: bookingStatus,
        opening_hours_note: openingHoursNote.trim() || null,
        est_cost_per_person: parseNumber(estCost),
        cost_currency: costCurrency.trim() || null,
        transport_legs: normalizeLegs(legs),
      });
      router.back();
    } catch (e: any) {
      appAlert('儲存失敗', e.message ?? '請稍後再試');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(day: TripDay) {
    if (!spot) return;
    setPickingDay(false);
    try {
      await assignToDay(spot.id, day.id);
      router.back();
    } catch (e: any) {
      appAlert('指派失敗', e.message ?? '請稍後再試');
    }
  }

  async function handleBackToPocket() {
    if (!spot) return;
    const ok = await appConfirm(
      '退回口袋名單',
      `「${spot.name}」會從排程移除，回到口袋名單。`,
      '退回'
    );
    if (!ok) return;
    try {
      await backToPocket(spot.id);
      router.back();
    } catch (e: any) {
      appAlert('操作失敗', e.message ?? '請稍後再試');
    }
  }

  async function handleDelete() {
    if (!spot) return;
    const ok = await appConfirm('刪除景點', `確定刪除「${spot.name}」？`, '刪除', true);
    if (!ok) return;
    try {
      await deleteSpot(spot.id);
      router.back();
    } catch (e: any) {
      appAlert('刪除失敗', e.message ?? '請稍後再試');
    }
  }

  if (!spot) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const scheduledDay = days.find((d) => d.id === spot.trip_day_id);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Button
          title="🧭 導航到這裡"
          onPress={() =>
            openGoogleMapsNavigation(
              { name: name.trim() || spot.name, address: address.trim() || null },
              destinationHint
            )
          }
        />

        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleText}>
            {scheduledDay
              ? `已排在 Day ${scheduledDay.day_number}`
              : '目前在口袋名單'}
          </Text>
          <Button
            title={scheduledDay ? '移到別天' : '排入某天'}
            variant="secondary"
            onPress={() => setPickingDay(true)}
            style={styles.smallButton}
          />
        </View>

        <Section title="基本資訊">
          <Input label="名稱 *" value={name} onChangeText={setName} />
          <Input
            label="地址（導航用，選填）"
            value={address}
            onChangeText={setAddress}
            placeholder="貼上 Google Maps 的地址"
          />
          <Text style={styles.fieldLabel}>分類</Text>
          <Chips options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
          <Text style={styles.fieldLabel}>優先度</Text>
          <Chips options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
          <View style={styles.spacer} />
          <Input
            label="備註"
            value={notes}
            onChangeText={setNotes}
            placeholder="例：要先到 B1 取整理券"
            multiline
            style={styles.multiline}
          />
        </Section>

        <Section title="時間（皆選填）">
          <View style={styles.timeRow}>
            <TimeField label="預計抵達" value={arrivalTime} onChange={setArrivalTime} />
            <TimeField label="預計離開" value={departureTime} onChange={setDepartureTime} />
          </View>
          <Input
            label="停留時間"
            value={durationNote}
            onChangeText={setDurationNote}
            placeholder="例：1.5–2 小時"
          />
        </Section>

        <Section title="預約與費用">
          <Text style={styles.fieldLabel}>預約狀態</Text>
          <Chips options={BOOKING_OPTIONS} value={bookingStatus} onChange={setBookingStatus} />
          <View style={styles.spacer} />
          <Input
            label="營業時間 / 公休備註"
            value={openingHoursNote}
            onChangeText={setOpeningHoursNote}
            placeholder="例：週三休，L.O. 20:30"
          />
          <View style={styles.costRow}>
            <View style={styles.costField}>
              <Input
                label="預估費用 / 人"
                value={estCost}
                onChangeText={setEstCost}
                keyboardType="decimal-pad"
                placeholder="只記錄不加總"
              />
            </View>
            <View style={styles.currencyField}>
              <Input
                label="幣別"
                value={costCurrency}
                onChangeText={setCostCurrency}
                placeholder="JPY"
                autoCapitalize="characters"
              />
            </View>
          </View>
        </Section>

        <Section title="到下一站的交通（皆選填）">
          <Text style={styles.transportHint}>
            有轉乘時，每換一種交通工具就新增一段（如：步行 → 地鐵 → 轉另一線）。
          </Text>
          {legs.length === 0 ? (
            <Text style={styles.emptyLegs}>尚未填寫交通段</Text>
          ) : null}
          {legs.map((leg, i) => (
            <View key={i} style={styles.legCard}>
              <View style={styles.legHeader}>
                <Text style={styles.legTitle}>第 {i + 1} 段</Text>
                <View style={styles.legActions}>
                  <Pressable
                    onPress={() => moveLeg(i, -1)}
                    disabled={i === 0}
                    style={styles.legBtn}
                  >
                    <Text style={[styles.legBtnText, i === 0 && styles.legBtnDisabled]}>
                      ↑
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => moveLeg(i, 1)}
                    disabled={i === legs.length - 1}
                    style={styles.legBtn}
                  >
                    <Text
                      style={[
                        styles.legBtnText,
                        i === legs.length - 1 && styles.legBtnDisabled,
                      ]}
                    >
                      ↓
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => removeLeg(i)} style={styles.legBtn}>
                    <Text style={[styles.legBtnText, styles.legBtnDelete]}>✕</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.fieldLabel}>交通方式</Text>
              <Chips
                options={TRANSPORT_OPTIONS}
                value={leg.mode}
                onChange={(v) => updateLeg(i, { mode: v })}
                allowDeselect
                onDeselect={() => updateLeg(i, { mode: null })}
              />
              <View style={styles.spacer} />
              <Input
                label="路線名"
                value={leg.line ?? ''}
                onChangeText={(v) => updateLeg(i, { line: v })}
                placeholder="例：東海道本線、江之島電鐵"
              />
              <Input
                label="候選班次"
                value={leg.departures ?? ''}
                onChangeText={(v) => updateLeg(i, { departures: v })}
                placeholder="例：09:03 / 09:16 / 09:31"
              />
              <View style={styles.timeRow}>
                <View style={styles.half}>
                  <Input
                    label="上車站"
                    value={leg.board_at ?? ''}
                    onChangeText={(v) => updateLeg(i, { board_at: v })}
                  />
                </View>
                <View style={styles.half}>
                  <Input
                    label="下車站"
                    value={leg.alight_at ?? ''}
                    onChangeText={(v) => updateLeg(i, { alight_at: v })}
                  />
                </View>
              </View>
              <View style={styles.timeRow}>
                <View style={styles.half}>
                  <Input
                    label="移動時間（分）"
                    value={leg.minutes != null ? String(leg.minutes) : ''}
                    onChangeText={(v) => {
                      const n = parseNumber(v);
                      updateLeg(i, { minutes: n != null ? Math.round(n) : null });
                    }}
                    keyboardType="number-pad"
                    placeholder="35"
                  />
                </View>
                <View style={styles.half}>
                  <Input
                    label="班距備註"
                    value={leg.frequency_note ?? ''}
                    onChangeText={(v) => updateLeg(i, { frequency_note: v })}
                    placeholder="每 15 分一班"
                  />
                </View>
              </View>
              <Text style={styles.fieldLabel}>購票狀態</Text>
              <Chips
                options={BOOKING_OPTIONS}
                value={leg.booking_status}
                onChange={(v) => updateLeg(i, { booking_status: v })}
                allowDeselect
                onDeselect={() => updateLeg(i, { booking_status: null })}
              />
              <View style={styles.spacer} />
              <View style={styles.costRow}>
                <View style={styles.costField}>
                  <Input
                    label="交通費 / 人"
                    value={leg.cost_per_person != null ? String(leg.cost_per_person) : ''}
                    onChangeText={(v) => updateLeg(i, { cost_per_person: parseNumber(v) })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <Input
                label="此段備註"
                value={leg.notes ?? ''}
                onChangeText={(v) => updateLeg(i, { notes: v })}
                placeholder="例：往渋谷方向月台、車尾車廂較空"
                multiline
                style={styles.multiline}
              />
            </View>
          ))}
          <Button
            title="＋ 新增交通段"
            variant="secondary"
            onPress={addLeg}
          />
        </Section>

        <Button title="儲存" onPress={handleSave} loading={saving} />

        <View style={styles.dangerZone}>
          {scheduledDay ? (
            <Button title="退回口袋名單" variant="secondary" onPress={handleBackToPocket} />
          ) : null}
          <Button title="刪除景點" variant="danger" onPress={handleDelete} />
        </View>
      </ScrollView>

      <DayPickerModal
        visible={pickingDay}
        days={days}
        title={`「${spot.name}」排到哪一天？`}
        onSelect={handleAssign}
        onClose={() => setPickingDay(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 64 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  scheduleText: { fontSize: 14, color: COLORS.textSecondary },
  smallButton: { height: 38, paddingHorizontal: 14 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionBody: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  spacer: { height: 16 },
  timeRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  costRow: { flexDirection: 'row', gap: 12 },
  costField: { flex: 2 },
  currencyField: { flex: 1 },
  multiline: { height: 72, paddingTop: 12, textAlignVertical: 'top' },
  dangerZone: { marginTop: 24, gap: 10 },
  transportHint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  emptyLegs: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  legCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.background,
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  legTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  legActions: { flexDirection: 'row', gap: 4 },
  legBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  legBtnText: { fontSize: 16, color: COLORS.text, fontWeight: '700' },
  legBtnDisabled: { color: COLORS.border },
  legBtnDelete: { color: COLORS.danger },
});
