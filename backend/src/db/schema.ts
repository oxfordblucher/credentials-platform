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

export const sessions = pgTable("sessions", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull().references(() => users.id),
  token: varchar({ length: 255 }).notNull(),
  created: timestamp(),
  expiration: timestamp()
});

export const credentials = pgTable("credentials", {
  id: integer().primaryKey(),
  userId: uuid().notNull().references(() => users.id),
  type: varchar({ length: 50 }).notNull(),
  created: timestamp()
});

export const criteria = pgTable("criteria", {
  id: integer().primaryKey(),
  credId: integer("credential_id").references(() => credentials.id),
  name: varchar({ length: 50 }).notNull()
});
