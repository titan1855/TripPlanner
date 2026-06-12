import { useAuthStore } from '../store/auth';

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const initialized = useAuthStore((s) => s.initialized);
  return { session, profile, initialized, isLoggedIn: !!session };
}
