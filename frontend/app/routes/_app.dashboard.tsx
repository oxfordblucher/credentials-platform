import { redirect } from 'react-router';
import { getToken } from '~/lib/auth/tokenStore';
import type { OrgRole } from '~/lib/types';

interface JwtPayload {
  orgRole: OrgRole | null;
}

function decodeJwtPayload(token: string): JwtPayload {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64)) as JwtPayload;
}

export async function clientLoader() {
  const token = getToken();
  if (!token) return redirect('/login');

  const { orgRole } = decodeJwtPayload(token);

  if (orgRole === 'admin' || orgRole === 'owner') {
    return redirect('/admin/credential-types');
  }
  return redirect('/credentials');
}

export default function Dashboard() {
  return null;
}
