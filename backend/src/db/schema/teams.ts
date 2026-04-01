import { pgTable, varchar, timestamp, uuid, text, primaryKey } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: uuid().defaultRandom().primaryKey(),
  org_id: uuid().notNull(),
  manager_id: uuid(),
  name: varchar({ length: 100 }),
  description: text(),
  created: timestamp().notNull().defaultNow()
});

export const teamMembers = pgTable("team_members", {
  user_id: uuid().notNull(),
  team_id: uuid().notNull(),
  joined: timestamp().notNull().defaultNow()
}, (t) => [primaryKey({ columns: [t.user_id, t.team_id] })]);