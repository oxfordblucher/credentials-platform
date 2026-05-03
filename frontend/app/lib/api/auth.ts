import { apiFetch } from '~/lib/api/client';
import { setToken, clearToken } from '~/lib/auth/tokenStore';
import { getMyProfile } from '~/lib/api/profiles';
import type { AuthUser, OrgRole } from '~/lib/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  dob: string; // ISO date string
  email: string;
  password: string;
}

interface JwtPayload {
  id: string;
  orgId: string;
  sessionId: string;
  orgRole: OrgRole | null;
}

function decodeJwtPayload<T>(token: string): T {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64)) as T;
}

export async function login(data: LoginPayload): Promise<{ user: AuthUser; accessToken: string }> {
  const { token } = await apiFetch<{ message: string; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: data.email, password: data.password }),
    skipAuth: true,
  });

  setToken(token);

  const profile = await getMyProfile();
  const { sessionId } = decodeJwtPayload<JwtPayload>(token);

  const user: AuthUser = {
    id: profile.id,
    firstName: profile.first,
    lastName: profile.last,
    email: profile.email,
    orgId: profile.org?.id ?? '',
    orgRole: profile.org_role,
    sessionId,
  };

  return { user, accessToken: token };
}

export async function register(data: RegisterPayload): Promise<void> {
  await apiFetch<{ message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      email: data.email,
      password: data.password,
    }),
    skipAuth: true,
  });
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  const { token } = await apiFetch<{ message: string; token: string }>('/auth/refresh', {
    method: 'POST',
    skipAuth: true,
  });
  setToken(token);
  return { accessToken: token };
}

export async function logout(): Promise<void> {
  await apiFetch<{ message: string }>('/auth/logout', {
    method: 'DELETE',
  });
  clearToken();
}
