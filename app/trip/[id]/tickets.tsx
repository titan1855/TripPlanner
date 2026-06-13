import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TicketCard } from '../../../src/components/tickets/TicketCard';
import { Button } from '../../../src/components/ui/Button';
import { Chips } from '../../../src/components/ui/Chips';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Input } from '../../../src/components/ui/Input';
import { SheetModal } from '../../../src/components/ui/SheetModal';
import { appAlert, appConfirm } from '../../../src/lib/dialog';
import {
  createTicket,
  deleteTicket,
  findMissingTicketSpots,
  listTickets,
  updateTicket,
} from '../../../src/services/tickets';
import { listSpots } from '../../../src/services/spots';
import type { Spot, Ticket } from '../../../src/types/database';
import type {
  TicketBookingStatus,
  TicketNeedsBooking,
  TicketType,
} from '../../../src/types/enums';
import {
  COLORS,
  TICKET_NEEDS_LABEL,
  TICKET_STATUS_LABEL,
  TICKET_TYPE_EMOJI,
  TICKET_TYPE_LABEL,
} from '../../../src/utils/constants';

const TYPE_OPTIONS = (Object.keys(TICKET_TYPE_LABEL) as TicketType[]).map((t) => ({
  value: t,
  label: TICKET_TYPE_LABEL[t],
  emoji: TICKET_TYPE_EMOJI[t],
}));
const NEEDS_OPTIONS = (Object.keys(TICKET_NEEDS_LABEL) as TicketNeedsBooking[]).map(
  (n) => ({ value: n, label: TICKET_NEEDS_LABEL[n] })
);
const STATUS_OPTIONS = (Object.keys(TICKET_STATUS_LABEL) as TicketBookingStatus[]).map(
  (s) => ({ value: s, label: TICKET_STATUS_LABEL[s] })
);

type GroupKey = 'urgent' | 'booked' | 'onsite' | 'collected';

function groupOf(t: Ticket): GroupKey {
  if (t.booking_status === 'collected') return 'collected';
  if (t.needs_booking === 'required' && t.booking_status === 'not_booked') return 'urgent';
  if (t.booking_status === 'booked') return 'booked';
  return 'onsite';
}

const GROUPS: { key: GroupKey; title: string; color: string }[] = [
  { key: 'urgent', title: '⚠️ 需預訂但未訂', color: COLORS.danger },
  { key: 'booked', title: '已預訂', color: COLORS.primary },
  { key: 'onsite', title: '現場處理 / 已含通票', color: COLORS.textSecondary },
  { key: 'collected', title: '已取票', color: COLORS.success },
];

export default function TicketsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [spotPickerOpen, setSpotPickerOpen] = useState(false);

  // 表單欄位
  const [title, setTitle] = useState('');
  const [ticketType, setTicketType] = useState<TicketType>('admission');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('');
  const [needs, setNeeds] = useState<TicketNeedsBooking>('required');
  const [status, setStatus] = useState<TicketBookingStatus>('not_booked');
  const [deadline, setDeadline] = useState('');
  const [reference, setReference] = useState('');
  const [linkedSpotId, setLinkedSpotId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([listTickets(id), listSpots(id)]);
      setTickets(t);
      setSpots(s);
    } catch (e: any) {
      appAlert('載入失敗', e.message ?? '請稍後再試');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const spotName = (spotId: string | null) =>
    spots.find((s) => s.id === spotId)?.name ?? null;

  function openForm(ticket: Ticket | null, prefillSpot?: Spot) {
    setEditing(ticket);
    setTitle(ticket?.title ?? prefillSpot?.name ?? '');
    setTicketType(
      ticket?.ticket_type ??
        (prefillSpot?.transport_booking_status === 'need_booking'
          ? 'transport'
          : 'admission')
    );
    setPrice(ticket?.price != null ? String(ticket.price) : '');
    setCurrency(ticket?.currency ?? '');
    setNeeds(ticket?.needs_booking ?? 'required');
    setStatus(ticket?.booking_status ?? 'not_booked');
    setDeadline(ticket?.booking_deadline ?? '');
    setReference(ticket?.booking_reference ?? '');
    setLinkedSpotId(ticket?.linked_spot_id ?? prefillSpot?.id ?? null);
    setNotes(ticket?.notes ?? '');
    setFormOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      appAlert('請輸入票券名稱');
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      ticket_type: ticketType,
      price: price ? parseFloat(price) || null : null,
      currency: currency.trim() || null,
      needs_booking: needs,
      booking_status: status,
      booking_deadline: deadline.trim() || null,
      booking_reference: reference.trim() || null,
      linked_spot_id: linkedSpotId,
      notes: notes.trim() || null,
    };
    try {
      if (editing) await updateTicket(editing.id, payload);
      else await createTicket({ trip_id: id, ...payload });
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
    const ok = await appConfirm('刪除票券', `確定刪除「${editing.title}」？`, '刪除', true);
    if (!ok) return;
    try {
      await deleteTicket(editing.id);
      setFormOpen(false);
      await load();
    } catch (e: any) {
      appAlert('刪除失敗', e.message ?? '請稍後再試');
    }
  }

  const missingSpots = findMissingTicketSpots(spots, tickets);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {missingSpots.length > 0 ? (
          <View style={styles.missingBox}>
            <Text style={styles.missingTitle}>
              💡 這些景點/交通標了「需預訂」，但還沒建票券：
            </Text>
            {missingSpots.map((s) => (
              <Pressable
                key={s.id}
                style={styles.missingRow}
                onPress={() => openForm(null, s)}
              >
                <Text style={styles.missingName} numberOfLines={1}>
                  {s.name}
                  {s.transport_booking_status === 'need_booking' ? '（交通段）' : ''}
                </Text>
                <Text style={styles.missingAction}>＋ 補建</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {tickets.length === 0 && missingSpots.length === 0 ? (
          <EmptyState
            emoji="🎫"
            title="還沒登記票券"
            subtitle="交通票與門票統一管理，需預訂未訂的會紅色置頂提醒"
            actionTitle="＋ 新增票券"
            onAction={() => openForm(null)}
          />
        ) : (
          GROUPS.map((group) => {
            const list = tickets.filter((t) => groupOf(t) === group.key);
            if (list.length === 0) return null;
            return (
              <View key={group.key} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: group.color }]}>
                  {group.title}（{list.length}）
                </Text>
                {list.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    linkedSpotName={spotName(t.linked_spot_id)}
                    urgent={group.key === 'urgent'}
                    onPress={() => openForm(t)}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {tickets.length > 0 || missingSpots.length > 0 ? (
        <View style={styles.footer}>
          <Button title="＋ 新增票券" onPress={() => openForm(null)} />
        </View>
      ) : null}

      <SheetModal
        visible={formOpen}
        title={editing ? '編輯票券' : '新增票券'}
        onClose={() => setFormOpen(false)}
      >
        <Input
          label="票券名稱 *"
          value={title}
          onChangeText={setTitle}
          placeholder="例：teamLab 門票、新幹線 東京→三島"
        />
        <Text style={styles.fieldLabel}>類型</Text>
        <Chips options={TYPE_OPTIONS} value={ticketType} onChange={setTicketType} />
        <View style={styles.spacer} />
        <View style={styles.row}>
          <View style={styles.costField}>
            <Input
              label="票價"
              value={price}
              onChangeText={setPrice}
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
        <Text style={styles.fieldLabel}>預訂需求</Text>
        <Chips options={NEEDS_OPTIONS} value={needs} onChange={setNeeds} />
        <View style={styles.spacer} />
        <Text style={styles.fieldLabel}>預訂狀態</Text>
        <Chips options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        <View style={styles.spacer} />
        <Input
          label="預訂期限"
          value={deadline}
          onChangeText={setDeadline}
          placeholder="例：需提前 3 天、5/1 開搶"
        />
        <Input
          label="訂位代號 / 購票網址"
          value={reference}
          onChangeText={setReference}
          autoCapitalize="none"
        />
        <Text style={styles.fieldLabel}>綁定景點（選填）</Text>
        <Pressable style={styles.spotPicker} onPress={() => setSpotPickerOpen(true)}>
          <Text style={linkedSpotId ? styles.spotPickerValue : styles.spotPickerEmpty}>
            {spotName(linkedSpotId) ?? '點擊選擇景點或交通段'}
          </Text>
          {linkedSpotId ? (
            <Pressable onPress={() => setLinkedSpotId(null)} hitSlop={8}>
              <Text style={styles.clearText}>清除</Text>
            </Pressable>
          ) : null}
        </Pressable>
        <Input
          label="備註"
          value={notes}
          onChangeText={setNotes}
          placeholder="例：一日票 800，分開買 990；需列印紙本"
          multiline
          style={styles.multiline}
        />
        <Button title="儲存" onPress={handleSave} loading={saving} />
        {editing ? (
          <View style={styles.deleteWrap}>
            <Button title="刪除票券" variant="danger" onPress={handleDelete} />
          </View>
        ) : null}
      </SheetModal>

      <SheetModal
        visible={spotPickerOpen}
        title="綁定哪個景點？"
        onClose={() => setSpotPickerOpen(false)}
      >
        {spots.length === 0 ? (
          <Text style={styles.empty}>這趟行程還沒有景點</Text>
        ) : (
          spots.map((s) => (
            <Pressable
              key={s.id}
              style={styles.spotRow}
              onPress={() => {
                setLinkedSpotId(s.id);
                setSpotPickerOpen(false);
              }}
            >
              <Text style={styles.spotRowText} numberOfLines={1}>
                {s.name}
              </Text>
              {s.id === linkedSpotId ? <Text style={styles.spotRowCheck}>✓</Text> : null}
            </Pressable>
          ))
        )}
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  missingBox: {
    backgroundColor: `${COLORS.warning}14`,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  missingTitle: { fontSize: 13, color: COLORS.text, marginBottom: 8 },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  missingName: { flex: 1, fontSize: 14, color: COLORS.text },
  missingAction: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  footer: { padding: 16, paddingTop: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 6 },
  spacer: { height: 16 },
  row: { flexDirection: 'row', gap: 12 },
  costField: { flex: 2 },
  currencyField: { flex: 1 },
  multiline: { height: 72, paddingTop: 12, textAlignVertical: 'top' },
  deleteWrap: { marginTop: 10 },
  spotPicker: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  spotPickerValue: { fontSize: 16, color: COLORS.text },
  spotPickerEmpty: { fontSize: 16, color: COLORS.textSecondary },
  clearText: { color: COLORS.danger, fontSize: 13 },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  spotRowText: { flex: 1, fontSize: 15, color: COLORS.text },
  spotRowCheck: { fontSize: 16, color: COLORS.success, fontWeight: '700' },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingVertical: 24,
  },
});
