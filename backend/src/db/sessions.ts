import { pgTable, text, varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.ts";

export const sessions = pgTable("sessions", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull().references(() => users.id),
  token: text().notNull(),
  device: varchar({ length: 512 }),
  ip: varchar({ length: 45 }),
  created: timestamp().notNull().defaultNow(),
  expiration: timestamp().notNull().default(sql`now() + INTERVAL '7d'`)
});