import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  refreshToken,
} from '~/lib/api/auth';
import { clearToken } from '~/lib/auth/tokenStore';
import { getMyProfile } from '~/lib/api/profiles';
import type { AuthUser } from '~/lib/types';

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildAuthUser(profile: Awaited<ReturnType<typeof getMyProfile>>, accessToken: string): AuthUser {
  const base64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const { sessionId } = JSON.parse(atob(base64)) as { sessionId: string };
  return {
    id: profile.id,
    firstName: profile.first,
    lastName: profile.last,
    email: profile.email,
    orgId: profile.org?.id ?? '',
    orgRole: profile.org_role,
    sessionId,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function silentRefresh() {
      try {
        const { accessToken } = await refreshToken();
        const profile = await getMyProfile();
        setUser(buildAuthUser(profile, accessToken));
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    silentRefresh();
  }, []);

  useEffect(() => {
    function handleExpired() {
      setUser(null);
    }
    window.addEventListener('credplat:session-expired', handleExpired);
    return () => window.removeEventListener('credplat:session-expired', handleExpired);
  }, []);

  async function login(email: string, password: string) {
    const { user } = await apiLogin({ email, password });
    setUser(user);
  }

  async function logout() {
    await apiLogout();
    clearToken();
    setUser(null);
  }

  async function refresh() {
    const { accessToken } = await refreshToken();
    const profile = await getMyProfile();
    setUser(buildAuthUser(profile, accessToken));
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
