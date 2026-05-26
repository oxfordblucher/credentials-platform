import { useLoaderData, Link } from 'react-router';
import { apiFetch } from '~/lib/api/client';
import { useRequireRole } from '~/lib/auth/hooks';

export const handle = { title: 'Org Compliance' };

interface TeamCompliance {
  team: { id: string; name: string | null };
  compliance_rate: number;
  expiring_soon: number;
  non_compliant: number;
}

interface OrgComplianceData {
  org_id: string;
  teams: TeamCompliance[];
}

export async function clientLoader() {
  return apiFetch<OrgComplianceData>('/api/orgs/compliance');
}

function ComplianceBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color =
    pct >= 90 ? 'var(--color-accent)' :
    pct >= 60 ? 'var(--color-warning)' :
    'var(--color-danger)';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)] font-mono-label">Compliance rate</span>
        <span
          className="text-sm font-bold font-mono-label"
          style={{ color }}
        >
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AdminCompliancePage() {
  useRequireRole(['admin', 'owner']);

  const { teams } = useLoaderData<typeof clientLoader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold text-[var(--color-text)]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Org Compliance
        </h1>
        {teams.length > 0 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
            {teams.length} team{teams.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">
          No teams in this organisation yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(({ team, compliance_rate, expiring_soon, non_compliant }) => (
            <Link
              key={team.id}
              to={`/manager/teams/${team.id}/compliance`}
              className="group block bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm hover:border-[var(--color-accent)] hover:shadow-md transition-all duration-150"
            >
              {/* Team name */}
              <h2
                className="text-base font-semibold text-[var(--color-text)] mb-4 group-hover:text-[var(--color-accent)] transition-colors"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {team.name ?? 'Unnamed Team'}
              </h2>

              {/* Progress bar */}
              <ComplianceBar rate={compliance_rate} />

              {/* Stat chips */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span
                  className={[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                    expiring_soon > 0
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-[var(--color-bg-subtle)] border-[var(--color-border)] text-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${expiring_soon > 0 ? 'bg-amber-400' : 'bg-[var(--color-text-muted)]'}`} />
                  {expiring_soon} expiring
                </span>

                <span
                  className={[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                    non_compliant > 0
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-[var(--color-bg-subtle)] border-[var(--color-border)] text-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${non_compliant > 0 ? 'bg-red-400' : 'bg-[var(--color-text-muted)]'}`} />
                  {non_compliant} non-compliant
                </span>
              </div>

              {/* Drill-down hint */}
              <p className="mt-4 text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors flex items-center gap-1">
                View member matrix
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
