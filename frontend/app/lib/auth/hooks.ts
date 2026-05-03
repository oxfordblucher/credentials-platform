import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/lib/auth/context';
import type { AuthUser, OrgRole } from '~/lib/types';

export { useAuth };

type AllowedRole = OrgRole | 'manager' | 'member';

export function useRequireRole(allowedRoles: AllowedRole[]): AuthUser {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const needsAdmin = allowedRoles.includes('admin') || allowedRoles.includes('owner');
    const isAdminOrOwner = user.orgRole === 'admin' || user.orgRole === 'owner';
    if (needsAdmin && !isAdminOrOwner) {
      navigate('/dashboard', { replace: true });
    }
    // manager/member are team-scoped; server enforces them
  }, [user, isLoading, navigate, allowedRoles]);

  return user!;
}
