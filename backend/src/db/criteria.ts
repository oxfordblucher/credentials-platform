import { pgTable, unique, integer, varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const criteria = pgTable("criteria", {
  id: integer().primaryKey(),
  name: varchar({ length: 50 }).notNull()
});