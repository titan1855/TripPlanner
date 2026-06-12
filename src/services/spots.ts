import { supabase } from '../lib/supabase';

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
