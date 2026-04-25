import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { credentialTypes } from './credentials.js';

export const uploadTokens = pgTable('upload_tokens', {
  id: uuid().primaryKey().defaultRandom(),
  user_id: uuid().notNull().references(() => users.id),
  credential_type_id: uuid().notNull().references(() => credentialTypes.id),
  object_key: varchar({ length: 500 }).notNull(),
  expires_at: timestamp().notNull(),
});
