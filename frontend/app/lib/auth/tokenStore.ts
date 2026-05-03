// Store token on globalThis so it survives vi.resetModules() in tests
const g = globalThis as typeof globalThis & { __credplat_token?: string | null };

export function getToken(): string | null {
  return g.__credplat_token ?? null;
}

export function setToken(token: string): void {
  g.__credplat_token = token;
}

export function clearToken(): void {
  g.__credplat_token = null;
}
