import type { CredStatus } from '~/lib/types';

interface StatusBadgeProps {
  status: CredStatus | 'missing' | 'expiring_soon';
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const statusClasses: Record<CredStatus | 'missing' | 'expiring_soon', string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  active: 'bg-teal-100 text-teal-800 border border-teal-200',
  rejected: 'bg-red-100 text-red-800 border border-red-200',
  expired: 'bg-slate-100 text-slate-600 border border-slate-200',
  revoked: 'bg-red-200 text-red-900 border border-red-300',
  missing: 'bg-orange-100 text-orange-700 border border-orange-200',
  expiring_soon: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
};

const statusLabels: Record<CredStatus | 'missing' | 'expiring_soon', string> = {
  pending: 'Pending',
  active: 'Active',
  rejected: 'Rejected',
  expired: 'Expired',
  revoked: 'Revoked',
  missing: 'Missing',
  expiring_soon: 'Expiring Soon',
};

const sizeClasses: Record<NonNullable<StatusBadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function StatusBadge({ status, pulse = false, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium',
        statusClasses[status],
        sizeClasses[size],
        pulse ? 'status-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ fontFamily: 'DM Mono, monospace' }}
    >
      {statusLabels[status]}
    </span>
  );
}
