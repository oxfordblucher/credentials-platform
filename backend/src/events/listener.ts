import { and, eq, notExists } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  users,
  teamMembers,
  teams,
  teamCredentials,
  userCredentials,
  credentialTypes,
  rejectionReasons,
} from '../db/schema/index.js';
import { evtEmitter } from './emitter.js';
import { Events, EventPayloads } from './event.js';
import { sendEmail } from '../services/email.serv.js';
import * as tmpl from '../services/emailTemplates.js';

function asyncHandler<T>(fn: (data: T) => Promise<void>) {
  return (data: T) => {
    fn(data).catch(err => console.error('[listener] Unhandled error:', err));
  };
}

evtEmitter.on(
  Events.CREDENTIAL_REQUIRED,
  asyncHandler(async ({ teamId, teamName, credId, credName }: EventPayloads[typeof Events.CREDENTIAL_REQUIRED]) => {
    const members = await db
      .select({ email: users.email, first: users.first, last: users.last })
      .from(teamMembers)
      .innerJoin(users, eq(users.id, teamMembers.user_id))
      .where(and(
        eq(teamMembers.team_id, teamId),
        eq(teamMembers.role, 'member'),
        notExists(
          db.select().from(userCredentials).where(and(
            eq(userCredentials.credential_id, credId),
            eq(userCredentials.user_id, teamMembers.user_id),
          ))
        ),
      ));

    await Promise.all(members.map(m =>
      sendEmail({
        to: m.email,
        subject: `New requirement: ${credName}`,
        html: tmpl.credentialRequired(`${m.first} ${m.last}`, credName, teamName),
      })
    ));
  }),
);

evtEmitter.on(
  Events.CREDENTIAL_SUBMITTED,
  asyncHandler(async ({ userId, credId, credName }: EventPayloads[typeof Events.CREDENTIAL_SUBMITTED]) => {
    const [members, managers] = await Promise.all([
      db.select({ first: users.first, last: users.last })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      db.select({ email: users.email, first: users.first, last: users.last })
        .from(teams)
        .innerJoin(teamMembers, and(eq(teamMembers.team_id, teams.id), eq(teamMembers.user_id, userId)))
        .innerJoin(teamCredentials, and(
          eq(teamCredentials.team_id, teams.id),
          eq(teamCredentials.credential_id, credId),
        ))
        .innerJoin(users, eq(users.id, teams.manager_id)),
    ]);

    const member = members[0];
    if (!member || managers.length === 0) return;
    const memberName = `${member.first} ${member.last}`;

    await Promise.all(managers.map(mgr =>
      sendEmail({
        to: mgr.email,
        subject: `New submission: ${credName}`,
        html: tmpl.credentialSubmitted(`${mgr.first} ${mgr.last}`, memberName, credName),
      })
    ));
  }),
);

evtEmitter.on(
  Events.CREDENTIAL_VERIFIED,
  asyncHandler(async ({ userId, credId, credName }: EventPayloads[typeof Events.CREDENTIAL_VERIFIED]) => {
    const [row] = await db
      .select({
        email: users.email,
        first: users.first,
        last: users.last,
        expiration_date: userCredentials.expiration_date,
      })
      .from(users)
      .leftJoin(userCredentials, and(
        eq(userCredentials.user_id, userId),
        eq(userCredentials.credential_id, credId),
      ))
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) return;

    const expirationDate = row.expiration_date
      ? row.expiration_date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : undefined;

    await sendEmail({
      to: row.email,
      subject: `Credential verified: ${credName}`,
      html: tmpl.credentialVerified(`${row.first} ${row.last}`, credName, expirationDate),
    });
  }),
);

evtEmitter.on(
  Events.CREDENTIAL_REJECTED,
  asyncHandler(async ({ userId, credName, rejectionReasonId, reviewNotes }: EventPayloads[typeof Events.CREDENTIAL_REJECTED]) => {
    const [[member], [reason]] = await Promise.all([
      db.select({ email: users.email, first: users.first, last: users.last })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      db.select({ label: rejectionReasons.label })
        .from(rejectionReasons)
        .where(eq(rejectionReasons.id, rejectionReasonId))
        .limit(1),
    ]);

    if (!member) return;

    await sendEmail({
      to: member.email,
      subject: `Credential submission rejected: ${credName}`,
      html: tmpl.credentialRejected(
        `${member.first} ${member.last}`,
        credName,
        reason?.label ?? 'See notes',
        reviewNotes,
      ),
    });
  }),
);

evtEmitter.on(
  Events.CREDENTIAL_REVOKED,
  asyncHandler(async ({ userId, credId, credName }: EventPayloads[typeof Events.CREDENTIAL_REVOKED]) => {
    const [row] = await db
      .select({
        email: users.email,
        first: users.first,
        last: users.last,
        review_notes: userCredentials.review_notes,
      })
      .from(users)
      .leftJoin(userCredentials, and(
        eq(userCredentials.user_id, userId),
        eq(userCredentials.credential_id, credId),
      ))
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) return;

    await sendEmail({
      to: row.email,
      subject: `Credential revoked: ${credName}`,
      html: tmpl.credentialRevoked(
        `${row.first} ${row.last}`,
        credName,
        row.review_notes ?? 'No reason provided',
      ),
    });
  }),
);

evtEmitter.on(
  Events.CREDENTIAL_EXPIRING,
  asyncHandler(async ({ userId, credId, daysUntilExpiry }: EventPayloads[typeof Events.CREDENTIAL_EXPIRING]) => {
    const [[member], [cred]] = await Promise.all([
      db.select({ email: users.email, first: users.first, last: users.last })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      db.select({ name: credentialTypes.name })
        .from(credentialTypes)
        .where(eq(credentialTypes.id, credId))
        .limit(1),
    ]);

    if (!member || !cred) return;

    await sendEmail({
      to: member.email,
      subject: `Credential expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}: ${cred.name}`,
      html: tmpl.credentialExpiring(`${member.first} ${member.last}`, cred.name, daysUntilExpiry),
    });
  }),
);
