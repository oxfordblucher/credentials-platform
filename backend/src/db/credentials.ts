import { pgTable, unique, text, integer, varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { orgs } from "./orgs.ts";

export const credentials = pgTable("credentials", {
  id: uuid().primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  description: text()
});

export const orgCredentials = pgTable("organization_credentials", {
  id: uuid().primaryKey(),
  org: uuid().notNull().references(() => orgs.id),
  credential: uuid().notNull().references(() => credentials.id)
});

export const userCredentials = pgTable("user_credentials", {
  id: uuid().primaryKey(),
  user: uuid().notNull().references(() => users.id),
  credential: uuid().notNull().references(() => credentials.id),
  verifier: uuid().references(() => users.id),
  file: varchar({ length: 255 }),
  submitted: timestamp().notNull().defaultNow(),
  verification: timestamp(),
  expiration: timestamp()
});