import { drizzle } from "drizzle-orm/node-postgres";
import { invites } from "../db/invites.js";

const db = drizzle(process.env.DATABASE_URL!);