import { pgTable, varchar, timestamp, uuid, text, primaryKey } from "drizzle-orm/pg-core";
import { roleEnum } from "./enums.js";
import { users } from "./users.js";

export const teams = pgTable("teams", {
  id: uuid().defaultRandom().primaryKey(),
  org_id: uuid().notNull(),
  manager_id: uuid(),
  name: varchar({ length: 100 }),
  description: text(),
  created: timestamp().notNull().defaultNow(),
  deleted: timestamp()
});

export const teamMembers = pgTable("team_members", {
  user_id: uuid().notNull().references(() => users.id),
  team_id: uuid().notNull().references(() => teams.id),
  role: roleEnum().notNull(),
  joined: timestamp().notNull().defaultNow()
}, (t) => [primaryKey({ columns: [t.user_id, t.team_id] })]);

export type NewTeam = typeof teams.$inferInsert;