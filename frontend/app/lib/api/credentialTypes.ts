import { apiFetch } from '~/lib/api/client';
import type {
  CredentialType,
  CreateCredentialTypePayload,
  UpdateCredentialTypePayload,
} from '~/lib/types';

export async function listCredentialTypes(
  opts?: { includeDeactivated?: boolean }
): Promise<{ credentialTypes: CredentialType[] }> {
  const params = opts?.includeDeactivated ? '?include_deactivated=true' : '';
  return apiFetch<{ credentialTypes: CredentialType[] }>(
    `/api/orgs/credential-types${params}`
  );
}

export async function createCredentialType(
  data: CreateCredentialTypePayload
): Promise<{ credentialType: CredentialType }> {
  return apiFetch<{ credentialType: CredentialType }>('/api/orgs/credential-types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCredentialType(
  id: string,
  data: UpdateCredentialTypePayload
): Promise<{ credentialType: CredentialType }> {
  return apiFetch<{ credentialType: CredentialType }>(
    `/api/orgs/credential-types/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function deactivateCredentialType(id: string): Promise<void> {
  return apiFetch<void>(`/api/orgs/credential-types/${id}`, {
    method: 'DELETE',
  });
}
