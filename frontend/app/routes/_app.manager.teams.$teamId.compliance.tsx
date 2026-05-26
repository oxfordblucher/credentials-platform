import { useLoaderData } from 'react-router';
import type { ClientLoaderFunctionArgs } from 'react-router';
import { format, parseISO } from 'date-fns';
import { apiFetch } from '~/lib/api/client';

export const handle = { title: 'Compliance' };

interface CredentialCell {
  credential_type: { id: string; name: string };
  status: string | null;
  expiration_date: string | null;
  days_until_expiry: number | null;
}

interface MatrixRow {
  user: { id: string; first_name: string; last_name: string };
  credentials: CredentialCell[];
}

interface ComplianceData {
  team_id: string;
  team_name: string;
  summary: {
    total_members: number;
    fully_compliant: number;
    has_gaps: number;
    has_expiring: number;
  };
  matrix: MatrixRow[];
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  return apiFetch<ComplianceData>(`/api/teams/${params.teamId}/compliance`);
}

// ── Status helpers ────────────────────────────────────────────────────────────

function isExpiringSoon(cell: CredentialCell) {
  return cell.status === 'active' && cell.days_until_expiry !== null && cell.days_until_expiry <= 30;
}

type CellVariant = 'active' | 'expiring' | 'pending' | 'bad' | 'missing';

function cellVariant(cell: CredentialCell): CellVariant {
  if (!cell.status) return 'missing';
  if (isExpiringSoon(cell)) return 'expiring';
  if (cell.status === 'active') return 'active';
  if (cell.status === 'pending') return 'pending';
  return 'bad';
}

const VARIANT_STYLES: Record<CellVariant, { badge: string; dot: string; label: string }> = {
  active:   { badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
  expiring: { badge: 'bg-amber-50 border-amber-200 text-amber-700',       dot: 'bg-amber-400',   label: 'Expiring' },
  pending:  { badge: 'bg-blue-50 border-blue-200 text-blue-700',           dot: 'bg-blue-400',    label: 'Pending' },
  bad:      { badge: 'bg-red-50 border-red-200 text-red-600',              dot: 'bg-red-400',     label: '' },
  missing:  { badge: 'bg-[var(--color-bg-subtle)] border-[var(--color-border)] text-[var(--color-text-muted)]', dot: '', label: '—' },
};

function badgeLabel(cell: CredentialCell, variant: CellVariant) {
  if (variant === 'bad') {
    const s = cell.status!;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return VARIANT_STYLES[variant].label;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] font-mono-label mb-2">
        {label}
      </p>
      <p
        className="text-3xl font-bold"
        style={{ fontFamily: 'Syne, sans-serif', color: accent ?? 'var(--color-text)' }}
      >
        {value}
      </p>
    </div>
  );
}

export default function TeamCompliancePage() {
  const data = useLoaderData<typeof clientLoader>();
  const { team_name, summary, matrix } = data;

  const credTypes: { id: string; name: string }[] = matrix[0]?.credentials.map(c => c.credential_type) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-[var(--color-text)]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {team_name ? `${team_name} — Compliance` : 'Compliance'}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Credential status for all team members
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={summary.total_members} />
        <StatCard label="Fully Compliant" value={summary.fully_compliant} accent="var(--color-accent)" />
        <StatCard label="Has Gaps" value={summary.has_gaps} accent="var(--color-danger)" />
        <StatCard label="Expiring Soon" value={summary.has_expiring} accent="var(--color-warning)" />
      </div>

      {/* Matrix */}
      {matrix.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">
          No members or required credentials to display.
        </div>
      ) : credTypes.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">
          No credential requirements configured for this team.
        </div>
      ) : (
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] font-mono-label mb-4"
          >
            Member Matrix
          </p>
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] shadow-sm">
            <div
              className="min-w-max"
              style={{
                display: 'grid',
                gridTemplateColumns: `minmax(160px, 220px) repeat(${credTypes.length}, minmax(140px, 1fr))`,
              }}
            >
              {/* Header row */}
              <div className="px-4 py-3 bg-[var(--color-bg-subtle)] border-b border-r border-[var(--color-border)] flex items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] font-mono-label">
                  Member
                </span>
              </div>
              {credTypes.map((ct, i) => (
                <div
                  key={ct.id}
                  className={[
                    'px-4 py-3 bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)] flex items-center',
                    i < credTypes.length - 1 ? 'border-r' : '',
                  ].join(' ')}
                >
                  <span
                    className="text-xs font-semibold text-[var(--color-text)] truncate"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                    title={ct.name}
                  >
                    {ct.name}
                  </span>
                </div>
              ))}

              {/* Data rows */}
              {matrix.map((row, rowIdx) => {
                const isLast = rowIdx === matrix.length - 1;
                return (
                  <>
                    {/* Member name cell */}
                    <div
                      key={`name-${row.user.id}`}
                      className={[
                        'px-4 py-4 border-r border-[var(--color-border)] flex items-center gap-3',
                        !isLast ? 'border-b' : '',
                        'bg-white',
                      ].join(' ')}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ backgroundColor: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}
                      >
                        {row.user.first_name[0]}{row.user.last_name[0]}
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text)] truncate">
                        {row.user.first_name} {row.user.last_name}
                      </span>
                    </div>

                    {/* Credential cells */}
                    {row.credentials.map((cell, colIdx) => {
                      const variant = cellVariant(cell);
                      const styles = VARIANT_STYLES[variant];
                      const label = badgeLabel(cell, variant);

                      return (
                        <div
                          key={`${row.user.id}-${cell.credential_type.id}`}
                          className={[
                            'px-4 py-4 flex flex-col justify-center gap-1 bg-white',
                            !isLast ? 'border-b border-[var(--color-border)]' : '',
                            colIdx < credTypes.length - 1 ? 'border-r border-[var(--color-border)]' : '',
                          ].join(' ')}
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border w-fit ${styles.badge}`}
                          >
                            {styles.dot && (
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
                            )}
                            {label}
                          </span>
                          {cell.expiration_date && (
                            <span className="text-xs text-[var(--color-text-muted)] font-mono-label pl-0.5">
                              {variant === 'expiring' && cell.days_until_expiry !== null
                                ? `${cell.days_until_expiry}d left`
                                : format(parseISO(cell.expiration_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
