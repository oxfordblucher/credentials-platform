import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError } from '~/lib/api/client';
import { setToken, clearToken } from '~/lib/auth/tokenStore';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('apiFetch', () => {
  beforeEach(() => {
    clearToken();
    mockFetch.mockReset();
  });

  it('throws ApiError on non-2xx response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Not found' }), { status: 404 })
    );
    await expect(apiFetch('/test')).rejects.toBeInstanceOf(ApiError);
  });

  it('injects Authorization header when token is set', async () => {
    setToken('my-token');
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    await apiFetch('/test');
    const [, init] = mockFetch.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer my-token',
    });
  });

  it('retries once after successful refresh on 401', async () => {
    setToken('old-token');
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'new-token' }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: 'ok' }), { status: 200 })
      );
    const result = await apiFetch<{ result: string }>('/protected');
    expect(result.result).toBe('ok');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('dispatches session-expired and throws on refresh failure', async () => {
    setToken('old-token');
    const events: string[] = [];
    window.addEventListener('credplat:session-expired', () => events.push('expired'));
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 401 }));
    await expect(apiFetch('/protected')).rejects.toThrow();
    expect(events).toContain('expired');
  });
});
