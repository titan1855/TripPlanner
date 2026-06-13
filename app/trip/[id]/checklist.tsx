import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/ui/Button';
import { Chips } from '../../../src/components/ui/Chips';
import { DateField } from '../../../src/components/ui/DateField';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Input } from '../../../src/components/ui/Input';
import { SheetModal } from '../../../src/components/ui/SheetModal';
import { appAlert, appConfirm } from '../../../src/lib/dialog';
import {
  createChecklistItem,
  createChecklistItems,
  deleteChecklistItem,
  isUrgent,
  listChecklist,
  updateChecklistItem,
} from '../../../src/services/checklist';
import { listMembers } from '../../../src/services/members';
import type { ChecklistItem, TripMember } from '../../../src/types/database';
import type { ChecklistCategory, Importance } from '../../../src/types/enums';
import {
  CHECKLIST_CATEGORY_EMOJI,
  CHECKLIST_CATEGORY_LABEL,
  COLORS,
  IMPORTANCE_COLOR,
  IMPORTANCE_LABEL,
} from '../../../src/utils/constants';
import { CHECKLIST_TEMPLATES } from '../../../src/utils/checklistTemplates';
import { formatDateLabel, todayISO } from '../../../src/utils/date';

const CATEGORY_ORDER: ChecklistCategory[] = [
  'document',
  'transport',
  'ticket',
  'packing',
  'other',
];
const CATEGORY_OPTIONS = CATEGORY_ORDER.map((c) => ({
  value: c,
  label: CHECKLIST_CATEGORY_LABEL[c],
  emoji: CHECKLIST_CATEGORY_EMOJI[c],
}));
const IMPORTANCE_OPTIONS = (Object.keys(IMPORTANCE_LABEL) as Importance[]).map((i) => ({
  value: i,
  label: IMPORTANCE_LABEL[i],
  color: IMPORTANCE_COLOR[i],
}));

function MemberDot({ member }: { member: TripMember }) {
  return (
    <View style={[styles.avatar, { backgroundColor: member.avatar_color ?? COLORS.border }]}>
      <Text style={styles.avatarText}>{member.nickname.slice(0, 1)}</Text>
    </View>
  );
}

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());

  // 表單欄位
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChecklistCategory>('other');
  const [dueDate, setDueDate] = useState('');
  const [importance, setImportance] = useState<Importance>('medium');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, mem] = await Promise.all([listChecklist(id), listMembers(id)]);
      setItems(list);
      setMembers(mem);
    } catch (e: any) {
      appAlert('載入失敗', e.message ?? '請稍後再試');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openForm(item: ChecklistItem | null) {
    setEditing(item);
    setTitle(item?.title ?? '');
    setCategory(item?.category ?? 'other');
    setDueDate(item?.due_date ?? '');
    setImportance(item?.importance ?? 'medium');
    setAssigneeId(item?.assignee_member_id ?? null);
    setNotes(item?.notes ?? '');
    setFormOpen(true);
  }

  async function toggleStatus(item: ChecklistItem) {
    // 樂觀更新
    const next = item.status === 'todo' ? 'done' : 'todo';
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: next } : i))
    );
    try {
      await updateChecklistItem(item.id, { status: next });
    } catch (e: any) {
      appAlert('更新失敗', e.message ?? '請稍後再試');
      await load();
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      appAlert('請輸入項目名稱');
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      category,
      due_date: dueDate || null,
      importance,
      assignee_member_id: assigneeId,
      notes: notes.trim() || null,
    };
    try {
      if (editing) await updateChecklistItem(editing.id, payload);
      else await createChecklistItem({ trip_id: id, ...payload });
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
    const ok = await appConfirm('刪除項目', `確定刪除「${editing.title}」？`, '刪除', true);
    if (!ok) return;
    try {
      await deleteChecklistItem(editing.id);
      setFormOpen(false);
      await load();
    } catch (e: any) {
      appAlert('刪除失敗', e.message ?? '請稍後再試');
    }
  }

  async function applyTemplates() {
    const rows = CHECKLIST_TEMPLATES.filter((_, i) => selectedTemplates.has(i)).map(
      (t) => ({ trip_id: id, ...t })
    );
    setTemplateOpen(false);
    setSelectedTemplates(new Set());
    if (rows.length === 0) return;
    try {
      await createChecklistItems(rows);
      await load();
    } catch (e: any) {
      appAlert('套用失敗', e.message ?? '請稍後再試');
    }
  }

  const assignee = (memberId: string | null) =>
    members.find((m) => m.id === memberId) ?? null;

  const urgentItems = items.filter(isUrgent);
  const today = todayISO();

  function renderItem(item: ChecklistItem, urgent = false) {
    const member = assignee(item.assignee_member_id);
    const done = item.status === 'done';
    const overdue = !done && item.due_date && item.due_date < today;
    return (
      <Pressable
        key={item.id}
        style={[styles.itemRow, urgent && styles.itemUrgent]}
        onPress={() => openForm(item)}
      >
        <Pressable
          style={[styles.checkbox, done && styles.checkboxDone]}
          onPress={() => toggleStatus(item)}
          hitSlop={8}
        >
          {done ? <Text style={styles.checkmark}>✓</Text> : null}
        </Pressable>
        <View style={styles.itemBody}>
          <Text style={[styles.itemTitle, done && styles.itemTitleDone]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.itemMeta}>
            <View
              style={[styles.importanceDot, { backgroundColor: IMPORTANCE_COLOR[item.importance] }]}
            />
            {item.due_date ? (
              <Text style={[styles.dueText, (urgent || overdue) && styles.dueUrgent]}>
                {overdue ? '已逾期 ' : ''}
                {formatDateLabel(item.due_date)}
              </Text>
            ) : null}
            {item.notes ? (
              <Text style={styles.noteText} numberOfLines={1}>
                {item.notes}
              </Text>
            ) : null}
          </View>
        </View>
        {member ? <MemberDot member={member} /> : null}
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <EmptyState
            emoji="✅"
            title="檢查表還是空的"
            subtitle="套用內建範本快速開始，或自己新增項目"
            actionTitle="📋 套用內建範本"
            onAction={() => setTemplateOpen(true)}
          />
        ) : (
          <>
            {urgentItems.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>
                  ⚠️ 緊急（逾期或 7 日內到期）
                </Text>
                {urgentItems.map((i) => renderItem(i, true))}
              </View>
            ) : null}
            {CATEGORY_ORDER.map((cat) => {
              const list = items.filter((i) => i.category === cat && !isUrgent(i));
              if (list.length === 0) return null;
              const doneCount = list.filter((i) => i.status === 'done').length;
              return (
                <View key={cat} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {CHECKLIST_CATEGORY_EMOJI[cat]} {CHECKLIST_CATEGORY_LABEL[cat]}（
                    {doneCount}/{list.length}）
                  </Text>
                  {list.map((i) => renderItem(i))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Button
            title="＋ 新增項目"
            onPress={() => openForm(null)}
            style={styles.footerButton}
          />
          <Button
            title="📋 範本"
            variant="secondary"
            onPress={() => setTemplateOpen(true)}
            style={styles.templateButton}
          />
        </View>
      </View>

      <SheetModal
        visible={formOpen}
        title={editing ? '編輯項目' : '新增項目'}
        onClose={() => setFormOpen(false)}
      >
        <Input
          label="項目 *"
          value={title}
          onChangeText={setTitle}
          placeholder="例：台灣駕照日文譯本"
        />
        <Text style={styles.fieldLabel}>類別</Text>
        <Chips options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        <View style={styles.spacer} />
        <DateField label="建議完成日（選填）" value={dueDate} onChange={setDueDate} />
        <Text style={styles.fieldLabel}>重要性</Text>
        <Chips options={IMPORTANCE_OPTIONS} value={importance} onChange={setImportance} />
        <View style={styles.spacer} />
        <Text style={styles.fieldLabel}>負責人（選填）</Text>
        <Chips
          options={members.map((m) => ({
            value: m.id,
            label: m.nickname,
            color: m.avatar_color ?? undefined,
          }))}
          value={assigneeId}
          onChange={setAssigneeId}
          allowDeselect
          onDeselect={() => setAssigneeId(null)}
        />
        <View style={styles.spacer} />
        <Input label="備註" value={notes} onChangeText={setNotes} />
        <Button title="儲存" onPress={handleSave} loading={saving} />
        {editing ? (
          <View style={styles.deleteWrap}>
            <Button title="刪除項目" variant="danger" onPress={handleDelete} />
          </View>
        ) : null}
      </SheetModal>

      <SheetModal
        visible={templateOpen}
        title="套用內建範本"
        onClose={() => setTemplateOpen(false)}
      >
        <Text style={styles.templateHint}>勾選要加入的項目（已存在的不會自動排除）</Text>
        {CHECKLIST_TEMPLATES.map((t, i) => {
          const selected = selectedTemplates.has(i);
          return (
            <Pressable
              key={i}
              style={[styles.templateRow, selected && styles.templateRowSelected]}
              onPress={() => {
                const next = new Set(selectedTemplates);
                if (selected) next.delete(i);
                else next.add(i);
                setSelectedTemplates(next);
              }}
            >
              <Text style={styles.templateCheck}>{selected ? '☑️' : '⬜️'}</Text>
              <Text style={styles.templateTitle}>{t.title}</Text>
              <Text style={styles.templateCat}>
                {CHECKLIST_CATEGORY_EMOJI[t.category]}
              </Text>
            </Pressable>
          );
        })}
        <View style={styles.templateActions}>
          <Button
            title="全選"
            variant="ghost"
            onPress={() =>
              setSelectedTemplates(new Set(CHECKLIST_TEMPLATES.map((_, i) => i)))
            }
          />
          <Button
            title={`加入（${selectedTemplates.size}）`}
            onPress={applyTemplates}
            disabled={selectedTemplates.size === 0}
            style={styles.footerButton}
          />
        </View>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  itemUrgent: { borderWidth: 1.5, borderColor: COLORS.danger },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  itemTitleDone: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  importanceDot: { width: 8, height: 8, borderRadius: 4 },
  dueText: { fontSize: 12, color: COLORS.textSecondary },
  dueUrgent: { color: COLORS.danger, fontWeight: '700' },
  noteText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  footer: { padding: 16, paddingTop: 8 },
  footerRow: { flexDirection: 'row', gap: 10 },
  footerButton: { flex: 1 },
  templateButton: { paddingHorizontal: 18 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 6 },
  spacer: { height: 16 },
  deleteWrap: { marginTop: 10 },
  templateHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  templateRowSelected: { borderWidth: 1.5, borderColor: COLORS.primary },
  templateCheck: { fontSize: 16 },
  templateTitle: { flex: 1, fontSize: 14, color: COLORS.text },
  templateCat: { fontSize: 16 },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
});
