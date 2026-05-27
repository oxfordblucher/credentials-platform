import { apiFetch } from '~/lib/api/client';
import type { OrgRole, TeamMembership } from '~/lib/types';

export interface ProfileResponse {
  id: string;
  first: string;
  last: string;
  dob: string;
  email: string;
  org_role: OrgRole | null;
  org: { id: string; name: string } | null;
  memberships: TeamMembership[];
}

export async function getMyProfile(): Promise<ProfileResponse> {
  const res = await apiFetch<{ profile: ProfileResponse }>('/me');
  return res.profile;
}
