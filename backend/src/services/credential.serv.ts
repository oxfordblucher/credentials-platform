import { credentials, NewUserCred, userCredentials } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { sql, and, eq } from "drizzle-orm";

export const fetchUserCreds = async (userId: string) => {
  const result = db.query.credentials.findMany({
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
}

export const addUserCred = async (userId: string, credInput: NewUserCred) => {
  const [result] = db.insert(userCredentials).values({
    ...credInput
  }).returning();

  return result ?? null;
}

export const confirmUserCred = async (mgrId: string, userId: string, credId: string) => {
  const [result] = db.update(userCredentials).set({
    verified: sql`now()`,
    verifier_id: mgrId
  }).where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credId)))
    .returning({

    });
}

export const removeUserCred = async () => {
  const [result] = db.delete(userCredentials).set({
    
  })
}