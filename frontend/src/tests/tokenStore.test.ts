import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, setToken, clearToken } from '~/lib/auth/tokenStore';

describe('tokenStore', () => {
  beforeEach(() => {
    clearToken();
  });

  it('returns null when no token is set', () => {
    expect(getToken()).toBeNull();
  });

  it('returns the token after setToken', () => {
    setToken('abc.def.ghi');
    expect(getToken()).toBe('abc.def.ghi');
  });

  it('returns null after clearToken', () => {
    setToken('abc.def.ghi');
    clearToken();
    expect(getToken()).toBeNull();
  });
});
