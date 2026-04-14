import { pgTable, text, varchar, uuid, timestamp, primaryKey, pgEnum } from "drizzle-orm/pg-core";

const credEnum = pgEnum('status', ['pending', 'active', 'expired', 'revoked']);

export const credentials = pgTable("credentials", {
  id: uuid().primaryKey().defaultRandom(),
  org_id: uuid().notNull(),
  name: varchar({ length: 100 }).notNull(),
  description: text()
});

export const teamCredentials = pgTable("team_credentials", {
  team_id: uuid().notNull(),
  credential_id: uuid().notNull()
}, (t) => [primaryKey({ columns: [t.team_id, t.credential_id] })]);

export const userCredentials = pgTable("user_credentials", {
  user_id: uuid().notNull(),
  credential_id: uuid().notNull(),
  verifier_id: uuid(),
  revoker_id: uuid(),
  file: varchar({ length: 255 }),
  submitted: timestamp().notNull().defaultNow(),
  verified: timestamp(),
  expiration: timestamp(),
  revocation: timestamp(),
  status: credEnum.notNull().default('pending')
}, (t) => [primaryKey({ columns: [t.user_id, t.credential_id] })]);

export type NewUserCred = typeof userCredentials.$inferInsert;