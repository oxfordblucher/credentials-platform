import { credentials, NewUserCred, userCredentials } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { sql, and, eq } from "drizzle-orm";

export const fetchUserCreds = async (userId: string) => {
  const result = await db.query.credentials.findMany({
    with: {
      userCredentials: {
        where: {
          user_id: userId
        },
        columns: {
          verifier_id: true,
          submitted: true,
          verified: true,
          expiration: true
        }
      }
    }
  })

  return result;
}

export const addUserCred = async (userId: string, credInput: NewUserCred) => {
  const [result] = await db.insert(userCredentials).values({
    ...credInput
  }).returning();

  return result ?? null;
}

export const confirmUserCred = async (mgrId: string, userId: string, credId: string) => {
  const [result] = await db.update(userCredentials).set({
    verified: sql`now()`,
    verifier_id: mgrId
  }).where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credId)))
    .returning({
      credId: userCredentials.credential_id,
      userId: userCredentials.user_id
    });

  return result ?? null;
}

export const removeUserCred = async () => {
  const [result] = db.delete(userCredentials).where();
}