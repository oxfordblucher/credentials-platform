import { afterAll } from '@jest/globals';
import { db } from '../../../db/index.js';

afterAll(async () => {
  await db.$client.end();
});
