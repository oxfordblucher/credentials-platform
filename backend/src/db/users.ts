import { pgTable, unique, date, varchar, uuid, timestamp, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { roleEnum } from "./enums.ts";
import { orgs } from "./orgs.ts";
import { teams } from "./teams.ts";

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  first: varchar('first_name', { length: 50 }).notNull(),
  last: varchar('last_name', { length: 50 }).notNull(),
  dob: date().notNull(),
  email: varchar({ length: 255 }).unique().notNull(),
  password: text().notNull(),
  role: roleEnum(),
  org: uuid().notNull().references(() => orgs.id),
  team: uuid().references(() => teams.id),
  created: timestamp().notNull().defaultNow(),
  login: timestamp("last_login")
}); 