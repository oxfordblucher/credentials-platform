import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

export const db = drizzle<typeof schema, typeof schema.relations>({
  connection: process.env.DATABASE_URL!,
  schema,
  relations: schema.relations,
});