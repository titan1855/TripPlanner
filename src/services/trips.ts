import { supabase } from '../lib/supabase';
import type { Trip } from '../types/database';
import type { TripStatus } from '../types/enums';
import { createDaysForRange, syncDaysToRange } from './days';

export interface TripInput {
  title: string;
  destination?: string | null;
  start_date: string;
  end_date: string;
  key_reminders?: string | null;
  status?: TripStatus;
}

export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTrip(id: string): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/** 建立行程，並自動產生 start_date ~ end_date 的所有 trip_days */
export async function createTrip(input: TripInput): Promise<Trip> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('尚未登入');

  const { data, error } = await supabase
    .from('trips')
    .insert({ ...input, owner_id: auth.user.id })
    .select()
    .single();
  if (error) throw error;

  await createDaysForRange(data.id, data.start_date, data.end_date);

  // owner 同時建立成員列（Phase 3 檢查表負責人、旅伴列表會用到）
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', auth.user.id)
    .maybeSingle();
  await supabase.from('trip_members').insert({
    trip_id: data.id,
    user_id: auth.user.id,
    nickname: profile?.display_name || profile?.email?.split('@')[0] || '我',
    is_owner: true,
  });

  return data;
}

/** 更新行程；日期有變動時同步 trip_days */
export async function updateTrip(id: string, input: Partial<TripInput>): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  if (input.start_date || input.end_date) {
    await syncDaysToRange(data.id, data.start_date, data.end_date);
  }
  return data;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}
