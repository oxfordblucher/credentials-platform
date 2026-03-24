import { pgTable, varchar, timestamp, boolean, uuid, text } from "drizzle-orm/pg-core";
import { roleEnum } from "./enums.ts";
import { users } from "./users.ts";
import { orgs } from "./orgs.ts";
import { teams } from "./teams.ts";
import { sql } from "drizzle-orm";

export const invites = pgTable("invites", {
  id: uuid().defaultRandom().primaryKey(),
  email: varchar({ length: 255 }).unique().notNull(),
  org: uuid().notNull().references(() => orgs.id),
  team: uuid().notNull().references(() => teams.id),
  role: roleEnum(),
  token: text().notNull(),
  used: boolean().notNull().default(false),
  inviter: uuid("invited_by").notNull().references(() => users.id),
  created: timestamp().notNull().defaultNow(),
  expiration: timestamp().notNull().default(sql`now() + INTERVAL '7d'`)
});