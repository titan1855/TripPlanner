import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import type { Spot, TripDay } from '../../../../src/types/database';
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
  const [tMode, setTMode] = useState<TransportMode | null>(null);
  const [tLine, setTLine] = useState('');
  const [tDepartures, setTDepartures] = useState('');
  const [tBoardAt, setTBoardAt] = useState('');
  const [tAlightAt, setTAlightAt] = useState('');
  const [tMinutes, setTMinutes] = useState('');
  const [tFrequencyNote, setTFrequencyNote] = useState('');
  const [tBookingStatus, setTBookingStatus] = useState<BookingStatus | null>(null);
  const [tCost, setTCost] = useState('');
  const [tNotes, setTNotes] = useState('');

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
        setTMode(s.transport_mode);
        setTLine(s.transport_line ?? '');
        setTDepartures(s.transport_departures ?? '');
        setTBoardAt(s.transport_board_at ?? '');
        setTAlightAt(s.transport_alight_at ?? '');
        setTMinutes(s.transport_minutes != null ? String(s.transport_minutes) : '');
        setTFrequencyNote(s.transport_frequency_note ?? '');
        setTBookingStatus(s.transport_booking_status);
        setTCost(
          s.transport_cost_per_person != null ? String(s.transport_cost_per_person) : ''
        );
        setTNotes(s.transport_notes ?? '');
      } catch (e: any) {
        Alert.alert('載入失敗', e.message ?? '請稍後再試');
      }
    })();
  }, [spotId, id]);

  function parseNumber(text: string): number | null {
    const n = parseFloat(text.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  async function handleSave() {
    if (!spot) return;
    if (!name.trim()) {
      Alert.alert('請輸入景點名稱');
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
        transport_mode: tMode,
        transport_line: tLine.trim() || null,
        transport_departures: tDepartures.trim() || null,
        transport_board_at: tBoardAt.trim() || null,
        transport_alight_at: tAlightAt.trim() || null,
        transport_minutes: tMinutes ? Math.round(parseNumber(tMinutes) ?? 0) : null,
        transport_frequency_note: tFrequencyNote.trim() || null,
        transport_booking_status: tBookingStatus,
        transport_cost_per_person: parseNumber(tCost),
        transport_notes: tNotes.trim() || null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('儲存失敗', e.message ?? '請稍後再試');
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
      Alert.alert('指派失敗', e.message ?? '請稍後再試');
    }
  }

  function handleBackToPocket() {
    if (!spot) return;
    Alert.alert('退回口袋名單', `「${spot.name}」會從排程移除，回到口袋名單。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '退回',
        onPress: async () => {
          try {
            await backToPocket(spot.id);
            router.back();
          } catch (e: any) {
            Alert.alert('操作失敗', e.message ?? '請稍後再試');
          }
        },
      },
    ]);
  }

  function handleDelete() {
    if (!spot) return;
    Alert.alert('刪除景點', `確定刪除「${spot.name}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSpot(spot.id);
            router.back();
          } catch (e: any) {
            Alert.alert('刪除失敗', e.message ?? '請稍後再試');
          }
        },
      },
    ]);
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
          <Text style={styles.fieldLabel}>交通方式</Text>
          <Chips
            options={TRANSPORT_OPTIONS}
            value={tMode}
            onChange={setTMode}
            allowDeselect
            onDeselect={() => setTMode(null)}
          />
          <View style={styles.spacer} />
          <Input
            label="路線名"
            value={tLine}
            onChangeText={setTLine}
            placeholder="例：東海道本線、江之島電鐵"
          />
          <Input
            label="候選班次"
            value={tDepartures}
            onChangeText={setTDepartures}
            placeholder="例：09:03 / 09:16 / 09:31"
          />
          <View style={styles.timeRow}>
            <View style={styles.half}>
              <Input label="上車站" value={tBoardAt} onChangeText={setTBoardAt} />
            </View>
            <View style={styles.half}>
              <Input label="下車站" value={tAlightAt} onChangeText={setTAlightAt} />
            </View>
          </View>
          <View style={styles.timeRow}>
            <View style={styles.half}>
              <Input
                label="移動時間（分）"
                value={tMinutes}
                onChangeText={setTMinutes}
                keyboardType="number-pad"
                placeholder="35"
              />
            </View>
            <View style={styles.half}>
              <Input
                label="班距備註"
                value={tFrequencyNote}
                onChangeText={setTFrequencyNote}
                placeholder="每 15 分一班"
              />
            </View>
          </View>
          <Text style={styles.fieldLabel}>購票狀態</Text>
          <Chips
            options={BOOKING_OPTIONS}
            value={tBookingStatus}
            onChange={setTBookingStatus}
            allowDeselect
            onDeselect={() => setTBookingStatus(null)}
          />
          <View style={styles.spacer} />
          <View style={styles.costRow}>
            <View style={styles.costField}>
              <Input
                label="交通費 / 人"
                value={tCost}
                onChangeText={setTCost}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <Input
            label="轉乘說明"
            value={tNotes}
            onChangeText={setTNotes}
            placeholder="例：淺草線到人形町轉日比谷線"
            multiline
            style={styles.multiline}
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
});
