import { useEffect, useState } from 'react';
import { ApiService, LOGIN_URL } from '../lib/api';
import { AuthUser } from '../types';

/**
 * Session state against the backend's Google OAuth flow.
 *
 * Probes GET /auth/me once on mount — the session cookie is httpOnly and
 * lives on the API origin, so the backend is the only source of truth.
 * `user` is null while signed out (the app still works anonymously with
 * the default fleet; per-user data needs a session).
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const probe = async () => {
      const current = await ApiService.getCurrentUser();
      setUser(current);
      setIsAuthLoading(false);
    };
    void probe();
  }, []);

  const signIn = () => {
    window.location.href = LOGIN_URL;
  };

  const signOut = async () => {
    await ApiService.logout();
    setUser(null);
    // Full reload clears per-user state (fleet, flight data) from memory
    window.location.reload();
  };

  return { user, isAuthLoading, signIn, signOut };
}
