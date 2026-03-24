import { pgTable, varchar, timestamp, uuid, text } from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { orgs } from "./orgs.ts";

export const teams = pgTable("teams", {
  id: uuid().defaultRandom().primaryKey(),
  org: uuid().notNull().references(() => orgs.id),
  manager: uuid().references(() => users.id),
  name: varchar({ length: 100 }),
  description: text(),
  created: timestamp().notNull().defaultNow()
});