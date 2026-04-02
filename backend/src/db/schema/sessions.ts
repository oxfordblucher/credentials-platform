import { pgTable, text, varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const sessions = pgTable("sessions", {
  id: uuid().primaryKey(),
  user_id: uuid().notNull(),
  token: text().notNull(),
  agent: varchar({ length: 512 }),
  device: varchar({ length: 100 }),
  ip: varchar({ length: 45 }),
  created: timestamp().notNull().defaultNow(),
  last_used: timestamp().notNull().defaultNow(),
  expiration: timestamp().notNull().default(sql`NOW() + INTERVAL '7d'`)
});