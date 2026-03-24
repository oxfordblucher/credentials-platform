import { drizzle } from "drizzle-orm/node-postgres";
import { teams } from "../db/teams.js";

const db = drizzle(process.env.DATABASE_URL!);