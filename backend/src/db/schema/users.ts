import { pgTable, unique, boolean, date, varchar, uuid, timestamp, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  first: varchar('first_name', { length: 50 }).notNull(),
  last: varchar('last_name', { length: 50 }).notNull(),
  dob: date({ mode: "date" }).notNull(),
  email: varchar({ length: 255 }).unique().notNull(),
  pending_email: varchar({ length: 255 }).unique(),
  password: text().notNull(),
  org_id: uuid().notNull(),
  is_admin: boolean().notNull().default(false),
  created: timestamp().notNull().defaultNow(),
  login: timestamp("last_login")
});

export type NewUser = typeof users.$inferInsert;