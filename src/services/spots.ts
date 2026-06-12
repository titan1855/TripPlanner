import * as Crypto from 'expo-crypto';
import { supabase } from '../lib/supabase';
import type { Spot } from '../types/database';
import type { SpotCategory, SpotPriority } from '../types/enums';

export interface SpotCreateInput {
  trip_id: string;
  name: string;
  address?: string | null;
  category?: SpotCategory;
  priority?: SpotPriority;
  notes?: string | null;
}

/** 整趟行程的所有景點（口袋 + 已排程），頁面端自行篩選 */
export async function listSpots(tripId: string): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('trip_id', tripId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSpot(id: string): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/** 新增景點（預設進口袋名單） */
export async function createSpot(input: SpotCreateInput): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSpot(id: string, patch: Partial<Spot>): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSpot(id: string): Promise<void> {
  const { error } = await supabase.from('spots').delete().eq('id', id);
  if (error) throw error;
}

async function nextSortOrder(dayId: string): Promise<number> {
  const { data, error } = await supabase
    .from('spots')
    .select('sort_order')
    .eq('trip_day_id', dayId)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0]?.sort_order ?? -1) + 1;
}

/** 指派到某一天（排在當天最後）；單獨移動會脫離原候選組 */
export async function assignToDay(spotId: string, dayId: string): Promise<Spot> {
  return updateSpot(spotId, {
    trip_day_id: dayId,
    sort_order: await nextSortOrder(dayId),
    alternative_group: null,
  });
}

/** 退回口袋名單 */
export async function backToPocket(spotId: string): Promise<Spot> {
  return updateSpot(spotId, {
    trip_day_id: null,
    sort_order: 0,
    alternative_group: null,
    visit_status: 'pending',
  });
}

/** 拖拉排序後整批更新當天的 sort_order */
export async function reorderDay(orderedSpotIds: string[]): Promise<void> {
  await Promise.all(
    orderedSpotIds.map((id, index) =>
      supabase
        .from('spots')
        .update({ sort_order: index })
        .eq('id', id)
        .then(({ error }) => {
          if (error) throw error;
        })
    )
  );
}

/** 把多個口袋景點以「候選方案組」加入某一天（同 alternative_group，排在當天最後） */
export async function assignAsAlternatives(
  spotIds: string[],
  dayId: string
): Promise<void> {
  const group = Crypto.randomUUID();
  const base = await nextSortOrder(dayId);
  await Promise.all(
    spotIds.map((id, i) =>
      supabase
        .from('spots')
        .update({ trip_day_id: dayId, sort_order: base + i, alternative_group: group })
        .eq('id', id)
        .then(({ error }) => {
          if (error) throw error;
        })
    )
  );
}

/** 候選組選定：被選者保留並脫離組，其餘退回口袋名單 */
export async function chooseAlternative(chosen: Spot): Promise<void> {
  if (!chosen.alternative_group) return;
  const group = chosen.alternative_group;

  const { error: keepError } = await supabase
    .from('spots')
    .update({ alternative_group: null })
    .eq('id', chosen.id);
  if (keepError) throw keepError;

  const { error } = await supabase
    .from('spots')
    .update({
      trip_day_id: null,
      sort_order: 0,
      alternative_group: null,
      visit_status: 'pending',
    })
    .eq('alternative_group', group)
    .neq('id', chosen.id);
  if (error) throw error;
}

/** 口袋名單（尚未排入任何一天）的景點數，總覽頁 badge 用 */
export async function countPocketSpots(tripId: string): Promise<number> {
  const { count, error } = await supabase
    .from('spots')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .is('trip_day_id', null);
  if (error) throw error;
  return count ?? 0;
}
