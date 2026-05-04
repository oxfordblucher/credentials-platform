import { formatDistanceToNow, parseISO } from 'date-fns';
import { StatusBadge } from '~/components/credentials/StatusBadge';
import type { CredentialAuditEntry, CredStatus } from '~/lib/types';

interface AuditTrailProps {
  entries: CredentialAuditEntry[];
  maxEntries?: number;
}

export function AuditTrail({ entries, maxEntries = 3 }: AuditTrailProps) {
  const visible = entries.slice(0, maxEntries);

  if (visible.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">No audit history.</p>;
  }

  return (
    <div className="space-y-2">
      {visible.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2 text-xs flex-wrap">
          {entry.fromStatus ? (
            <StatusBadge status={entry.fromStatus as CredStatus} size="sm" />
          ) : (
            <span
              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              —
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <StatusBadge status={entry.toStatus as CredStatus} size="sm" />
          <span className="text-[var(--color-text-muted)]">by</span>
          <span className="text-[var(--color-text)] font-medium truncate max-w-[120px]">
            {entry.actorId}
          </span>
          <span
            className="text-[var(--color-text-muted)] ml-auto"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {formatDistanceToNow(parseISO(entry.timestamp), { addSuffix: true })}
          </span>
        </div>
      ))}
      {entries.length > maxEntries && (
        <button
          type="button"
          className="text-xs text-[var(--color-accent)] hover:underline mt-1"
        >
          View full history
        </button>
      )}
    </div>
  );
}
