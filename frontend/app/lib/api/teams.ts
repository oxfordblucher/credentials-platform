import { apiFetch } from '~/lib/api/client';
import type {
  Team,
  TeamMember,
  Invite,
  CreateInvitePayload,
  AuthUser,
} from '~/lib/types';

export async function listTeams(): Promise<{ teams: Team[] }> {
  return apiFetch<{ teams: Team[] }>('/api/teams');
}

export async function createTeam(data: { name: string }): Promise<{ team: Team }> {
  return apiFetch<{ team: Team }>('/api/teams', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTeam(teamId: string): Promise<{ team: Team }> {
  return apiFetch<{ team: Team }>(`/api/teams/${teamId}`);
}

export async function listTeamMembers(teamId: string): Promise<{ members: TeamMember[] }> {
  return apiFetch<{ members: TeamMember[] }>(`/api/teams/${teamId}/members`);
}

export async function createInvite(data: CreateInvitePayload): Promise<{ invite: Invite }> {
  return apiFetch<{ invite: Invite }>('/api/teams/invites', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInvite(
  token: string
): Promise<{ invite: Invite & { teamName: string } }> {
  return apiFetch<{ invite: Invite & { teamName: string } }>(
    `/api/auth/invites/${token}`
  );
}

export async function acceptInvite(
  token: string,
  userData: { firstName: string; lastName: string; dob: string; password: string }
): Promise<{ user: AuthUser; accessToken: string }> {
  return apiFetch<{ user: AuthUser; accessToken: string }>(
    `/api/auth/invites/${token}/accept`,
    {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    }
  );
}

export async function listTeamRequirements(teamId: string): Promise<{ credentials: unknown[] }> {
  return apiFetch<{ credentials: unknown[] }>(`/api/teams/${teamId}/requirements`);
}

export async function addTeamRequirement(
  teamId: string,
  credentialTypeId: string
): Promise<{ credential: unknown }> {
  return apiFetch<{ credential: unknown }>(`/api/teams/${teamId}/requirements`, {
    method: 'POST',
    body: JSON.stringify({ credential_type_id: credentialTypeId }),
  });
}

export async function removeTeamRequirement(
  teamId: string,
  credentialTypeId: string
): Promise<{ deleted: unknown }> {
  return apiFetch<{ deleted: unknown }>(
    `/api/teams/${teamId}/requirements/${credentialTypeId}`,
    { method: 'DELETE' }
  );
}
