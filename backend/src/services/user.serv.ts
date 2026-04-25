import { db } from "../db/index.js";
import { sessions, users, NewUser } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { Transaction } from "../types/types.js";
import { encryptPW, verifyPW } from "../utils/encrypt.js";
import { deleteSessions } from "./session.serv.js";

export const fetchProfile = async (userId: string) => {
  const [result] = await db.query.users.findFirst({
    where: {
      id: userId
    },
    columns: {
      id: true,
      first: true,
      last: true,
      dob: true,
      email: true,
      org_role: true
    },
    with: {
      org: {
        columns: {
          id: true,
          name: true
        }
      },
      memberships: {
        columns: {
          role: true
        },
        with: {
          team: {
            columns: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  return result ?? null;
}

export const updateEmail = async (userId: string, email: string) => {
  const [existing] = await db.query.users.findFirst({
    where: {
      OR: [
        { email: email },
        { pending_email: email }
      ]
    }
  });

  if (existing) throw new AppError(409, "Email already in use");

  const [result] = await db.update(users).set({ 
    pending_email: email
  }).where(eq(users.id, userId)).returning({ newEmail: users.pending_email });

  return result ?? null;
}

export const updateName = async (userId: string, name: { first?: string, last?: string }) => {
  const updates: Partial<NewUser> = {};
  if (name.first) updates.first = name.first;
  if (name.last) updates.last = name.last;

  const [result] = await db.update(users).set(updates)
    .where(eq(users.id, userId)).returning({
      first: users.first, last: users.last
    });

  return result ?? null;
}

export const updatePassword = async (userId: string, password: string, newPass: string) => {
  const [user] = await db.select({ password: users.password }).from(users).where(eq(users.id, userId));
  if (!user) throw new AppError(404, "User not found");

  const isValid = await verifyPW(password, user.password);
  if (!isValid) throw new AppError(401, "Invalid password");

  const hashedPassword = await encryptPW(newPass);
  await db.transaction(async (tx: Transaction) => {
    await tx.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
    await deleteSessions(userId, undefined, tx);
  })
}