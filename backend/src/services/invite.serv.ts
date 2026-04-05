import { invites } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { InviteInput } from "../utils/zod.js";
import { eq, sql } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";

export const createInvites = async (invite: InviteInput, senderId: string) => {
  const result = await db.insert(invites).values({
    ...invite,
    inviter_id: senderId
  }).returning({
    id: invites.id,
    email: invites.email,
    expiration: invites.expiration
  });

  return result;
}

export const fetchInvites = async (id: string) => {
  const result = await db.select({
    id: invites.id,
    email: invites.email,
    expiration: invites.expiration
  }).from(invites);

  return result;
}

export const updateInvite = async (id: string) => {
  const result = await db.update(invites).set({
    expiration: sql`now() + INTERVAL '7d'`
  }).where(eq(invites.id, id));
  
  if (!result.rowCount) throw new AppError(404, 'Invite renewal failed')
}

export const deleteInvite = async (id: string) => {
  const result = await db.delete(invites).where(eq(invites.id, id));

  if (!result.rowCount) throw new AppError(404, "Invite not deleted");
}