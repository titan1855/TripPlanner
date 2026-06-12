import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/database';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /** 回傳是否已直接取得 session（false = 需先完成 email 驗證） */
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('讀取使用者資料失敗:', error.message);
    return null;
  }
  return data;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    set({
      session,
      profile: session ? await fetchProfile(session.user.id) : null,
      initialized: true,
    });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({ session: newSession });
      if (newSession) {
        fetchProfile(newSession.user.id).then((profile) => set({ profile }));
      } else {
        set({ profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    return !!data.session;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
}));
