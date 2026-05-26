import { and, eq, lte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userCredentials, credentialAuditLog } from '../db/schema/index.js';
import { computeNextAlertAt } from '../utils/expirationAlerts.js';
import { evtEmitter } from '../events/emitter.js';
import { Events } from '../events/event.js';

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const processExpirationAlerts = async (): Promise<{
  processed: number;
  expired: number;
  alerted: number;
}> => {
  const due = await db
    .select({
      user_id: userCredentials.user_id,
      credential_id: userCredentials.credential_id,
      status: userCredentials.status,
      expiration_date: userCredentials.expiration_date,
    })
    .from(userCredentials)
    .where(and(
      eq(userCredentials.status, 'active'),
      lte(userCredentials.next_alert_at, sql`NOW()`),
    ));

  let expired = 0;
  let alerted = 0;

  for (const row of due) {
    const now = new Date();
    const daysUntil = row.expiration_date
      ? Math.ceil((row.expiration_date.getTime() - now.getTime()) / MS_PER_DAY)
      : 0;

    if (daysUntil <= 0) {
      await db.transaction(async (tx) => {
        await tx.update(userCredentials)
          .set({ status: 'expired' })
          .where(and(
            eq(userCredentials.user_id, row.user_id),
            eq(userCredentials.credential_id, row.credential_id),
          ));

        await tx.insert(credentialAuditLog).values({
          user_id: row.user_id,
          credential_id: row.credential_id,
          from_status: row.status,
          to_status: 'expired',
          actor_id: SYSTEM_ACTOR_ID,
        });
      });
      expired++;
    } else {
      evtEmitter.emit(Events.CREDENTIAL_EXPIRING, {
        userId: row.user_id,
        credId: row.credential_id,
        daysUntilExpiry: daysUntil,
      });

      await db.update(userCredentials)
        .set({ next_alert_at: row.expiration_date ? computeNextAlertAt(row.expiration_date) : null })
        .where(and(
          eq(userCredentials.user_id, row.user_id),
          eq(userCredentials.credential_id, row.credential_id),
        ));
      alerted++;
    }
  }

  return { processed: due.length, expired, alerted };
};
