import { pgTable, unique, integer, varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.ts";

export const credentials = pgTable("credentials", {
  id: integer().primaryKey(),
  userId: uuid().notNull().references(() => users.id),
  type: varchar({ length: 50 }).notNull(),
  created: timestamp()
});