import { drizzle } from "drizzle-orm/node-postgres";
import crypto from 'crypto';
import { sessions } from "../db/sessions.js";

const db = drizzle(process.env.DATABASE_URL!);

const hashToken = (token: string) => {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export const createSession = async (id: string, token: string, device: string) => {
    await db.insert(sessions).values({
        userId: id,
        token: token,
        device: device
    });
}