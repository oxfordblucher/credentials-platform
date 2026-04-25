import { pgTable, varchar, timestamp, uuid, foreignKey, AnyPgTable } from "drizzle-orm/pg-core";

export const orgs = pgTable("organizations", {
  id: uuid().defaultRandom().primaryKey(),
  owner_id: uuid(),
  name: varchar({ length: 100 }).notNull(),
  address: varchar({ length: 255 }).notNull(),
  created: timestamp().notNull().defaultNow()
});