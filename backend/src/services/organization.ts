import { drizzle } from "drizzle-orm/node-postgres";
import { orgs } from "../db/orgs.js";

const db = drizzle(process.env.DATABASE_URL!);