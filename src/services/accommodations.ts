import { supabase } from '../lib/supabase';
import type { Accommodation } from '../types/database';

export async function listAccommodations(tripId: string): Promise<Accommodation[]> {
  const { data, error } = await supabase
    .from('accommodations')
    .select('*')
    .eq('trip_id', tripId)
    .order('check_in_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** 找出某天「當晚」住哪：check_in_date <= date < check_out_date */
export function accommodationForDate(
  accommodations: Accommodation[],
  date: string
): Accommodation | null {
  return (
    accommodations.find(
      (a) =>
        a.booking_status !== 'cancelled' &&
        a.check_in_date &&
        a.check_out_date &&
        a.check_in_date <= date &&
        date < a.check_out_date
    ) ?? null
  );
}

export type AccommodationInput = Omit<Accommodation, 'id' | 'created_at'>;

export async function createAccommodation(
  input: Partial<AccommodationInput> & { trip_id: string; name: string }
): Promise<Accommodation> {
  const { data, error } = await supabase
    .from('accommodations')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccommodation(
  id: string,
  patch: Partial<AccommodationInput>
): Promise<Accommodation> {
  const { data, error } = await supabase
    .from('accommodations')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAccommodation(id: string): Promise<void> {
  const { error } = await supabase.from('accommodations').delete().eq('id', id);
  if (error) throw error;
}
