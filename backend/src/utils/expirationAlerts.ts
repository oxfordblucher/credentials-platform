const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function computeNextAlertAt(expirationDate: Date): Date | null {
  const now = new Date();
  const daysUntil = Math.ceil((expirationDate.getTime() - now.getTime()) / MS_PER_DAY);

  if (daysUntil > 30) {
    return new Date(expirationDate.getTime() - 30 * MS_PER_DAY);
  }
  if (daysUntil >= 8) {
    return new Date(expirationDate.getTime() - 7 * MS_PER_DAY);
  }
  return null;
}
