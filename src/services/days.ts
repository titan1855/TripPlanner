import { supabase } from '../lib/supabase';
import type { TripDay } from '../types/database';
import { eachDateOfRange } from '../utils/date';

export async function listDays(tripId: string): Promise<TripDay[]> {
  const { data, error } = await supabase
    .from('trip_days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** 建立行程時依日期區間產生所有 trip_days */
export async function createDaysForRange(
  tripId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const rows = eachDateOfRange(startDate, endDate).map((date, i) => ({
    trip_id: tripId,
    day_number: i + 1,
    date,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('trip_days').insert(rows);
  if (error) throw error;
}

/**
 * 行程日期變更時同步 trip_days：
 * 新日期補建、超出範圍的刪除、保留仍在範圍內的（不動 area_summary 等內容），
 * 最後依日期重新編 day_number。
 */
export async function syncDaysToRange(
  tripId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const existing = await listDays(tripId);
  const wanted = eachDateOfRange(startDate, endDate);
  const wantedSet = new Set(wanted);
  const existingByDate = new Map(existing.map((d) => [d.date, d]));

  const toDelete = existing.filter((d) => !wantedSet.has(d.date)).map((d) => d.id);
  if (toDelete.length > 0) {
    const { error } = await supabase.from('trip_days').delete().in('id', toDelete);
    if (error) throw error;
  }

  const toInsert = wanted
    .filter((date) => !existingByDate.has(date))
    .map((date) => ({ trip_id: tripId, day_number: 0, date }));
  if (toInsert.length > 0) {
    const { error } = await supabase.from('trip_days').insert(toInsert);
    if (error) throw error;
  }

  const days = await listDays(tripId);
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].day_number !== i + 1) {
      const { error } = await supabase
        .from('trip_days')
        .update({ day_number: i + 1 })
        .eq('id', sorted[i].id);
      if (error) throw error;
    }
  }
}
