import { supabase } from '../lib/supabase';

/** 需預訂但未訂的票券數（總覽頁紅色 badge） */
export async function countUnbookedRequired(tripId: string): Promise<number> {
  const { count, error } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('needs_booking', 'required')
    .eq('booking_status', 'not_booked');
  if (error) throw error;
  return count ?? 0;
}
