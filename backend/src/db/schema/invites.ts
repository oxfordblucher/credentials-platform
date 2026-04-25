import { pgTable, varchar, timestamp, boolean, uuid, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { roleEnum } from "./enums.js";
import { users } from "./users.js";
import { teams } from "./teams.js";

export const invites = pgTable("invites", {
  id: uuid().defaultRandom().primaryKey(),
  email: varchar({ length: 255 }).unique().notNull(),
  org_id: uuid().notNull().references(() => users.id),
  team_id: uuid().notNull().references(() => teams.id),
  role: roleEnum(),
  token: text().notNull(),
  used: boolean().notNull().default(false),
  inviter_id: uuid().notNull().references(() => users.id),
  created: timestamp().notNull().defaultNow(),
  expiration: timestamp().notNull().default(sql`now() + INTERVAL '7d'`)
});