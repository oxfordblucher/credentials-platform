import { pgTable, unique, integer, varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

export const sessions = pgTable("sessions", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull().references(() => users.id),
  token: varchar({ length: 255 }).notNull(),
  created: timestamp(),
  expiration: timestamp()
});