import { supabase } from '../lib/supabase';
import type { ChecklistItem } from '../types/database';
import { parseDate, todayISO, toISODate } from '../utils/date';

/**
 * 緊急待辦數（總覽頁紅色 badge）：
 * status = todo 且 importance = high 且 due_date 已過或 7 日內
 */
export async function countUrgentTodos(tripId: string): Promise<number> {
  const limit = parseDate(todayISO());
  limit.setDate(limit.getDate() + 7);
  const { count, error } = await supabase
    .from('checklist_items')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('status', 'todo')
    .eq('importance', 'high')
    .not('due_date', 'is', null)
    .lte('due_date', toISODate(limit));
  if (error) throw error;
  return count ?? 0;
}

export async function listChecklist(tripId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type ChecklistInput = Omit<ChecklistItem, 'id' | 'created_at'>;

export async function createChecklistItem(
  input: Partial<ChecklistInput> & { trip_id: string; title: string }
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('checklist_items')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createChecklistItems(
  rows: (Partial<ChecklistInput> & { trip_id: string; title: string })[]
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from('checklist_items').insert(rows);
  if (error) throw error;
}

export async function updateChecklistItem(
  id: string,
  patch: Partial<ChecklistInput>
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('checklist_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase.from('checklist_items').delete().eq('id', id);
  if (error) throw error;
}

/** 紅色置頂規則：todo + high + (已過期或 7 日內到期) */
export function isUrgent(item: ChecklistItem): boolean {
  if (item.status !== 'todo' || item.importance !== 'high' || !item.due_date) {
    return false;
  }
  const limit = parseDate(todayISO());
  limit.setDate(limit.getDate() + 7);
  return item.due_date <= toISODate(limit);
}
