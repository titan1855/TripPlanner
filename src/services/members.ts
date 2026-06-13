import { supabase } from '../lib/supabase';
import type { TripMember } from '../types/database';
import { AVATAR_COLORS } from '../utils/constants';

export async function listMembers(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function nextAvatarColor(existing: TripMember[]): string {
  const used = new Set(existing.map((m) => m.avatar_color));
  return AVATAR_COLORS.find((c) => !used.has(c)) ?? AVATAR_COLORS[existing.length % AVATAR_COLORS.length];
}

/** 新增未註冊旅伴（只需名字，用於檢查表負責人） */
export async function addCompanion(
  tripId: string,
  nickname: string,
  existing: TripMember[]
): Promise<TripMember> {
  const { data, error } = await supabase
    .from('trip_members')
    .insert({
      trip_id: tripId,
      nickname: nickname.trim(),
      avatar_color: nextAvatarColor(existing),
      is_owner: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** 以 Email 邀請已註冊使用者（成為可共同編輯的旅伴）— 走 security definer RPC */
export async function inviteByEmail(
  tripId: string,
  email: string,
  existing: TripMember[]
): Promise<void> {
  const { error } = await supabase.rpc('invite_member_by_email', {
    p_trip_id: tripId,
    p_email: email.trim(),
    p_avatar_color: nextAvatarColor(existing),
  });
  if (error) throw error;
}

export async function updateMember(
  id: string,
  patch: Partial<Pick<TripMember, 'nickname' | 'avatar_color'>>
): Promise<TripMember> {
  const { data, error } = await supabase
    .from('trip_members')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeMember(id: string): Promise<void> {
  const { error } = await supabase.from('trip_members').delete().eq('id', id);
  if (error) throw error;
}
