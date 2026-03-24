import { pgTable, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const orgs = pgTable("organizations", {
  id: uuid().defaultRandom().primaryKey(),
  owner_id: uuid().references(() => users.id),
  name: varchar({ length: 100 }),
  address: varchar({ length: 255 }),
  created: timestamp().notNull().defaultNow()
});