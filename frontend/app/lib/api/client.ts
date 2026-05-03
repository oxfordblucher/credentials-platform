import { getToken, setToken, clearToken } from '~/lib/auth/tokenStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: unknown[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function callRefresh(): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options ?? {};
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...fetchOptions,
    headers,
  });

  if (res.status === 401 && !skipAuth) {
    const newToken = await callRefresh();
    if (newToken) {
      setToken(newToken);
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        credentials: 'include',
        ...fetchOptions,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
      if (!retryRes.ok) {
        const body = (await retryRes.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new ApiError(retryRes.status, body.message ?? retryRes.statusText);
      }
      return retryRes.json() as T;
    } else {
      clearToken();
      window.dispatchEvent(new Event('credplat:session-expired'));
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      errors?: unknown[];
    };
    throw new ApiError(res.status, body.message ?? res.statusText, body.errors);
  }

  return res.json() as T;
}
