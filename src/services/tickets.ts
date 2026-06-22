import { supabase } from '../lib/supabase';
import { transportNeedsBooking } from '../lib/transport';
import type { Spot, Ticket } from '../types/database';

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

export async function listTickets(tripId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type TicketInput = Omit<Ticket, 'id' | 'created_at'>;

export async function createTicket(
  input: Partial<TicketInput> & { trip_id: string; title: string }
): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTicket(
  id: string,
  patch: Partial<TicketInput>
): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTicket(id: string): Promise<void> {
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) throw error;
}

/**
 * 找出「景點或交通段標了需預訂、但還沒建對應票券」的 spots（提醒補建）。
 * 對應規則：該 spot 沒有任何票券 linked_spot_id 指向它。
 */
export function findMissingTicketSpots(spots: Spot[], tickets: Ticket[]): Spot[] {
  const linked = new Set(tickets.map((t) => t.linked_spot_id).filter(Boolean));
  return spots.filter(
    (s) =>
      (s.booking_status === 'need_booking' || transportNeedsBooking(s)) &&
      !linked.has(s.id)
  );
}
