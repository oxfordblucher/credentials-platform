import { pgTable, varchar, timestamp, uuid } from "drizzle-orm/pg-core";

export const orgs = pgTable("organizations", {
  id: uuid().defaultRandom().primaryKey(),
  admin_id: uuid(),
  name: varchar({ length: 100 }).notNull(),
  address: varchar({ length: 255 }).notNull(),
  created: timestamp().notNull().defaultNow()
});