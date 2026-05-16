import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { tokenStorage } from '@/shared/api/tokenStorage';
import { authApi } from '@/features/auth/api';
import type { AuthUser } from '@/features/auth/api';
import { setOnUnauthenticated } from '@/shared/api/httpClient';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!tokenStorage.getAccess() || !!tokenStorage.getRefresh());

  useEffect(() => {
    setOnUnauthenticated(() => {
      tokenStorage.clear();
      setUser(null);
    });
    let cancelled = false;
    (async () => {
      if (!tokenStorage.getAccess() && !tokenStorage.getRefresh()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        tokenStorage.clear();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    tokenStorage.setAccess(res.accessToken);
    tokenStorage.setRefresh(res.refreshToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      /* ignore */
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
