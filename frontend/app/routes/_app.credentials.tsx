import { useLoaderData, Link } from 'react-router';
import { useState } from 'react';
import { listMyCredentials } from '~/lib/api/credentials';
import { StatusBadge } from '~/components/credentials/StatusBadge';
import { MetadataTable } from '~/components/credentials/MetadataTable';
import { AuditTrail } from '~/components/credentials/AuditTrail';
import { formatExpiry, daysUntil, expiryColourClass } from '~/lib/utils/dates';
import { Button } from '~/components/ui/Button';
import type { MemberCredential, CredStatus } from '~/lib/types';

export const handle = { title: 'My Credentials' };

export async function clientLoader() {
  return listMyCredentials();
}

function SummaryBar({ credentials }: { credentials: MemberCredential[] }) {
  const active = credentials.filter((c) => c.status === 'active').length;
  const pending = credentials.filter((c) => c.status === 'pending').length;
  const missing = credentials.filter((c) => c.status === 'missing').length;
  const expiringSoon = credentials.filter((c) => c.isExpiringSoon).length;

  const items: { label: string; count: number; colour: string }[] = [
    { label: 'Active', count: active, colour: 'text-teal-700' },
    { label: 'Pending', count: pending, colour: 'text-amber-700' },
    { label: 'Missing', count: missing, colour: 'text-orange-700' },
    { label: 'Expiring Soon', count: expiringSoon, colour: 'text-yellow-700' },
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {items.map(({ label, count, colour }) => (
        <div
          key={label}
          className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-lg px-4 py-2 shadow-sm"
        >
          <span className={`text-xl font-bold ${colour}`}>{count}</span>
          <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
        </div>
      ))}
    </div>
  );
}

function CredentialCard({ cred }: { cred: MemberCredential }) {
  const [expanded, setExpanded] = useState(false);

  const { credentialType, userCredential, status, teamName, isExpiringSoon } = cred;
  const expiryDate = userCredential?.expirationDate ?? null;
  const days = expiryDate ? daysUntil(expiryDate) : null;

  const badgeStatus: CredStatus | 'missing' | 'expiring_soon' =
    isExpiringSoon && status === 'active' ? 'expiring_soon' : status as CredStatus | 'missing';

  const canUpload = status === 'missing' || status === 'rejected';
  const canResubmit = status === 'expired' || status === 'revoked';
  const isActive = status === 'active';
  const isPending = status === 'pending';

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Top */}
        <div className="mb-3">
          <h2
            className="text-base font-semibold text-[var(--color-text)]"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {credentialType.name}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{teamName}</p>
        </div>

        {/* Status badge */}
        <div className="mb-3">
          <StatusBadge status={badgeStatus} pulse={isPending} />
        </div>

        {/* Expiry */}
        {expiryDate && days !== null && (
          <p
            className={`text-xs mb-3 ${expiryColourClass(days)}`}
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {formatExpiry(expiryDate)}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {(canUpload || canResubmit) && (
            <Link
              to={`/credentials/${credentialType.id}/upload`}
              className="inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 bg-[var(--color-accent)] text-[var(--color-sidebar)] font-semibold hover:opacity-90 px-3 py-1.5 text-sm"
            >
              {canUpload ? 'Upload Document' : 'Resubmit'}
            </Link>
          )}
          {isPending && userCredential?.submittedAt && (
            <p className="text-xs text-[var(--color-text-muted)] self-center">
              Pending Review — submitted{' '}
              {new Date(userCredential.submittedAt).toLocaleDateString()}
            </p>
          )}
          {isActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? 'Hide Details' : 'View Details'}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: expanded ? '600px' : '0px' }}
      >
        {isActive && userCredential && (
          <div className="border-t border-[var(--color-border)] px-5 pb-5 pt-4 space-y-4">
            {userCredential.submittedMetadata && (
              <MetadataTable
                schema={credentialType.metadataSchema}
                metadata={userCredential.submittedMetadata}
                label="Submitted"
              />
            )}
            {userCredential.verifiedMetadata && (
              <div>
                <p className="text-xs font-medium text-amber-700 mb-2">Manager corrected</p>
                <MetadataTable
                  schema={credentialType.metadataSchema}
                  metadata={userCredential.verifiedMetadata}
                  label="Verified"
                />
              </div>
            )}
            {expiryDate && days !== null && (
              <p className="text-sm text-[var(--color-text-muted)]">
                Expires in{' '}
                <span className={`font-semibold ${expiryColourClass(days)}`}>
                  {days} day{days !== 1 ? 's' : ''}
                </span>
              </p>
            )}
            {(userCredential as typeof userCredential & { auditTrail?: import('~/lib/types').CredentialAuditEntry[] }).auditTrail && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                  Recent Activity
                </p>
                <AuditTrail
                  entries={(userCredential as typeof userCredential & { auditTrail?: import('~/lib/types').CredentialAuditEntry[] }).auditTrail!}
                  maxEntries={3}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CredentialsPage() {
  const { credentials } = useLoaderData<typeof clientLoader>();

  if (credentials.length === 0) {
    return (
      <>
        <h1
          className="text-2xl font-bold text-[var(--color-text)] mb-6"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          My Credentials
        </h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {/* Clipboard SVG */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-4"
            aria-hidden="true"
          >
            <rect x="16" y="8" width="32" height="44" rx="4" fill="#e2e6ed" />
            <rect x="24" y="4" width="16" height="8" rx="2" fill="#c8cdd6" />
            <rect x="22" y="22" width="20" height="2.5" rx="1.25" fill="#9ca3af" />
            <rect x="22" y="29" width="16" height="2.5" rx="1.25" fill="#9ca3af" />
            <rect x="22" y="36" width="12" height="2.5" rx="1.25" fill="#9ca3af" />
          </svg>
          <p className="text-[var(--color-text-muted)] max-w-sm">
            No credentials required yet. Your manager will notify you when requirements are
            assigned.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1
        className="text-2xl font-bold text-[var(--color-text)] mb-6"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        My Credentials
      </h1>
      <SummaryBar credentials={credentials} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {credentials.map((cred) => (
          <CredentialCard key={cred.credentialType.id} cred={cred} />
        ))}
      </div>
    </>
  );
}
