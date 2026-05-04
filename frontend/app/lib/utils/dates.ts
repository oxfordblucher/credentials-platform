import { format, parseISO, differenceInDays } from 'date-fns';

export function formatExpiry(date: string): string {
  const parsed = parseISO(date);
  const label = format(parsed, 'MMM d, yyyy');
  const days = daysUntil(date);
  return days >= 0 ? `Expires ${label}` : `Expired ${label}`;
}

export function daysUntil(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = parseISO(date);
  target.setHours(0, 0, 0, 0);
  return differenceInDays(target, now);
}

export function isExpiringSoon(date: string, thresholdDays = 30): boolean {
  const days = daysUntil(date);
  return days >= 0 && days <= thresholdDays;
}

export function expiryColourClass(daysRemaining: number): string {
  if (daysRemaining <= 7) return 'text-red-600';
  if (daysRemaining <= 30) return 'text-amber-600';
  return 'text-slate-500';
}
