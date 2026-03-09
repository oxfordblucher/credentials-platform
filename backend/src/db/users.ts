import { pgTable, unique, integer, varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  first: varchar('first_name', { length: 50 }).notNull(),
  last: varchar('last_name', { length: 50 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).unique().notNull(),
  password: varchar({ length: 255 }).notNull(),
  created: timestamp(),
  login: timestamp("login")
}); 