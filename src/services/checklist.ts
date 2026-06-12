import { supabase } from '../lib/supabase';
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
