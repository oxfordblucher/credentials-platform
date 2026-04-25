import { pgTable, uuid, timestamp, primaryKey, index, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

export const notifications = pgTable("notifications", {
  id: uuid().defaultRandom().primaryKey(),
  user_id: uuid().notNull().references(() => users.id),
  payload: jsonb(),
  created_at: timestamp().defaultNow(),
  read_at: timestamp()
}, (t) => [index('notification_idx').using('gin', sql`${t.payload} jsonb_path_ops`)]);