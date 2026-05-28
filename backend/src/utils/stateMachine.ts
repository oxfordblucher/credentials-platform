import { ConflictError } from '../errors/AppError.js';

type CredentialStatus = 'pending' | 'active' | 'rejected' | 'expired' | 'revoked';

const TRANSITIONS = new Map<CredentialStatus | null, CredentialStatus[]>([
  [null, ['pending']],
  ['pending', ['active', 'rejected']],
  ['rejected', ['pending']],
  ['active', ['revoked', 'expired']],
  ['expired', ['pending']],
  ['revoked', []],
]);

export function validateTransition(
  currentStatus: CredentialStatus | null,
  targetStatus: CredentialStatus,
): void {
  const allowed = TRANSITIONS.get(currentStatus) ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new ConflictError(
      `Invalid credential transition: ${currentStatus ?? 'none'} → ${targetStatus}`,
    );
  }
}
