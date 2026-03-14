import { pgTable, unique, date, varchar, uuid, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum('role', ['team member', 'manager', 'admin']);

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  first: varchar('first_name', { length: 50 }).notNull(),
  last: varchar('last_name', { length: 50 }).notNull(),
  dob: date().notNull(),
  email: varchar({ length: 255 }).unique().notNull(),
  password: varchar({ length: 255 }).notNull(),
  role: roleEnum(),
  confirmed: boolean().notNull().default(false),
  created: timestamp().notNull().defaultNow(),
  login: timestamp("last_login")
}); 