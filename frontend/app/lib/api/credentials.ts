import { apiFetch } from '~/lib/api/client';
import type {
  MemberCredential,
  UploadUrlResponse,
  ConfirmUploadPayload,
  UserCredential,
} from '~/lib/types';

export async function listMyCredentials(): Promise<{ credentials: MemberCredential[] }> {
  return apiFetch<{ credentials: MemberCredential[] }>('/api/credentials');
}

export async function requestUploadUrl(
  credentialTypeId: string,
  data: { filename: string; contentType: string }
): Promise<UploadUrlResponse> {
  return apiFetch<UploadUrlResponse>(
    `/api/credentials/${credentialTypeId}/upload-url`,
    {
      method: 'POST',
      body: JSON.stringify({ filename: data.filename, content_type: data.contentType }),
    }
  );
}

export async function confirmUpload(
  credentialTypeId: string,
  data: ConfirmUploadPayload
): Promise<{ credential: UserCredential }> {
  return apiFetch<{ credential: UserCredential }>(
    `/api/credentials/${credentialTypeId}/confirm-upload`,
    {
      method: 'POST',
      body: JSON.stringify({
        object_key: data.objectKey,
        submitted_metadata: data.submittedMetadata,
      }),
    }
  );
}
