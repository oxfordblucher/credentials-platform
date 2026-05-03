import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('~/lib/auth/context', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '~/lib/auth/context';
import { useRequireRole } from '~/lib/auth/hooks';

function TestComponent({ roles }: { roles: Array<'admin' | 'owner' | 'manager' | 'member'> }) {
  useRequireRole(roles);
  return <div>rendered</div>;
}

describe('useRequireRole', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('redirects to /login when user is null', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refresh: vi.fn(),
    });
    render(<TestComponent roles={['admin']} />);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('redirects to /dashboard when non-admin accesses admin route', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: '1', firstName: 'A', lastName: 'B', email: 'a@b.com',
        orgId: 'org1', orgRole: null, sessionId: 'sess1',
      },
      isLoading: false,
      login: vi.fn(), logout: vi.fn(), register: vi.fn(), refresh: vi.fn(),
    });
    render(<TestComponent roles={['admin']} />);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('does not redirect when admin accesses admin route', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: '1', firstName: 'A', lastName: 'B', email: 'a@b.com',
        orgId: 'org1', orgRole: 'admin', sessionId: 'sess1',
      },
      isLoading: false,
      login: vi.fn(), logout: vi.fn(), register: vi.fn(), refresh: vi.fn(),
    });
    render(<TestComponent roles={['admin']} />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not redirect while still loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: true,
      login: vi.fn(), logout: vi.fn(), register: vi.fn(), refresh: vi.fn(),
    });
    render(<TestComponent roles={['admin']} />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
