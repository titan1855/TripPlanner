import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Chips } from '../../../src/components/ui/Chips';
import { DateField } from '../../../src/components/ui/DateField';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Input } from '../../../src/components/ui/Input';
import { SheetModal } from '../../../src/components/ui/SheetModal';
import { appAlert, appConfirm } from '../../../src/lib/dialog';
import {
  createAccommodation,
  deleteAccommodation,
  listAccommodations,
  updateAccommodation,
} from '../../../src/services/accommodations';
import type { Accommodation } from '../../../src/types/database';
import type { AccommodationBookingStatus } from '../../../src/types/enums';
import {
  ACCOMMODATION_STATUS_COLOR,
  ACCOMMODATION_STATUS_LABEL,
  COLORS,
} from '../../../src/utils/constants';
import { formatDateLabel, tripDayCount } from '../../../src/utils/date';

const STATUS_OPTIONS = (
  Object.keys(ACCOMMODATION_STATUS_LABEL) as AccommodationBookingStatus[]
).map((s) => ({
  value: s,
  label: ACCOMMODATION_STATUS_LABEL[s],
  color: ACCOMMODATION_STATUS_COLOR[s],
}));

export default function AccommodationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<Accommodation[]>([]);
  const [editing, setEditing] = useState<Accommodation | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // 表單欄位
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState<AccommodationBookingStatus>('tbd');
  const [estCost, setEstCost] = useState('');
  const [currency, setCurrency] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await listAccommodations(id));
    } catch (e: any) {
      appAlert('載入失敗', e.message ?? '請稍後再試');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openForm(item: Accommodation | null) {
    setEditing(item);
    setName(item?.name ?? '');
    setAddress(item?.address ?? '');
    setCheckIn(item?.check_in_date ?? '');
    setCheckOut(item?.check_out_date ?? '');
    setReference(item?.booking_reference ?? '');
    setStatus(item?.booking_status ?? 'tbd');
    setEstCost(item?.est_cost != null ? String(item.est_cost) : '');
    setCurrency(item?.cost_currency ?? '');
    setNotes(item?.notes ?? '');
    setFormOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      appAlert('請輸入住宿名稱');
      return;
    }
    if (checkIn && checkOut && checkIn > checkOut) {
      appAlert('退房日不可早於入住日');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      address: address.trim() || null,
      check_in_date: checkIn || null,
      check_out_date: checkOut || null,
      booking_reference: reference.trim() || null,
      booking_status: status,
      est_cost: estCost ? parseFloat(estCost) || null : null,
      cost_currency: currency.trim() || null,
      notes: notes.trim() || null,
    };
    try {
      if (editing) await updateAccommodation(editing.id, payload);
      else await createAccommodation({ trip_id: id, ...payload });
      setFormOpen(false);
      await load();
    } catch (e: any) {
      appAlert('儲存失敗', e.message ?? '請稍後再試');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    const ok = await appConfirm('刪除住宿', `確定刪除「${editing.name}」？`, '刪除', true);
    if (!ok) return;
    try {
      await deleteAccommodation(editing.id);
      setFormOpen(false);
      await load();
    } catch (e: any) {
      appAlert('刪除失敗', e.message ?? '請稍後再試');
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <EmptyState
            emoji="🛏"
            title="還沒登記住宿"
            subtitle="一段住宿一筆，總覽頁會自動對應每天住哪"
            actionTitle="＋ 新增住宿"
            onAction={() => openForm(null)}
          />
        ) : (
          items.map((item) => (
            <Card key={item.id} onPress={() => openForm(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Badge
                  label={ACCOMMODATION_STATUS_LABEL[item.booking_status]}
                  color={ACCOMMODATION_STATUS_COLOR[item.booking_status]}
                />
              </View>
              {item.check_in_date && item.check_out_date ? (
                <Text style={styles.dates}>
                  {formatDateLabel(item.check_in_date)} 入住 →{' '}
                  {formatDateLabel(item.check_out_date)} 退房（
                  {tripDayCount(item.check_in_date, item.check_out_date) - 1} 晚）
                </Text>
              ) : null}
              {item.booking_reference ? (
                <Text style={styles.meta}>訂位代號：{item.booking_reference}</Text>
              ) : null}
              {item.est_cost != null ? (
                <Text style={styles.meta}>
                  💴 {item.est_cost} {item.cost_currency ?? ''}
                </Text>
              ) : null}
              {item.notes ? (
                <Text style={styles.notes} numberOfLines={2}>
                  {item.notes}
                </Text>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      {items.length > 0 ? (
        <View style={styles.footer}>
          <Button title="＋ 新增住宿" onPress={() => openForm(null)} />
        </View>
      ) : null}

      <SheetModal
        visible={formOpen}
        title={editing ? '編輯住宿' : '新增住宿'}
        onClose={() => setFormOpen(false)}
      >
        <Input
          label="住宿名稱 *"
          value={name}
          onChangeText={setName}
          placeholder="例：星野 OMO3 淺草"
        />
        <Input label="地址" value={address} onChangeText={setAddress} />
        <View style={styles.row}>
          <View style={styles.half}>
            <DateField label="入住日" value={checkIn} onChange={setCheckIn} />
          </View>
          <View style={styles.half}>
            <DateField
              label="退房日"
              value={checkOut}
              onChange={setCheckOut}
              minimumDate={checkIn || undefined}
            />
          </View>
        </View>
        <Input
          label="訂位代號"
          value={reference}
          onChangeText={setReference}
          autoCapitalize="characters"
        />
        <Text style={styles.fieldLabel}>預訂狀態</Text>
        <Chips options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        <View style={styles.spacer} />
        <View style={styles.row}>
          <View style={styles.costField}>
            <Input
              label="預估費用"
              value={estCost}
              onChangeText={setEstCost}
              keyboardType="decimal-pad"
              placeholder="只記錄不加總"
            />
          </View>
          <View style={styles.currencyField}>
            <Input
              label="幣別"
              value={currency}
              onChangeText={setCurrency}
              placeholder="JPY"
              autoCapitalize="characters"
            />
          </View>
        </View>
        <Input
          label="備註"
          value={notes}
          onChangeText={setNotes}
          placeholder="例：三島站北口步行 3 分"
          multiline
          style={styles.multiline}
        />
        <Button title="儲存" onPress={handleSave} loading={saving} />
        {editing ? (
          <View style={styles.deleteWrap}>
            <Button title="刪除住宿" variant="danger" onPress={handleDelete} />
          </View>
        ) : null}
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  dates: { fontSize: 14, color: COLORS.text, marginBottom: 4 },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  notes: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  footer: { padding: 16, paddingTop: 8 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  costField: { flex: 2 },
  currencyField: { flex: 1 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 6 },
  spacer: { height: 16 },
  multiline: { height: 72, paddingTop: 12, textAlignVertical: 'top' },
  deleteWrap: { marginTop: 10 },
});
