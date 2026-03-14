import { drizzle } from "drizzle-orm/node-postgres";
import users from "../db/users.js";
import { RegisterUser } from "../types/types.js";
import bcrypt from 'bcrypt';

const db = drizzle(process.env.DATABASE_URL!);

export const createUser = async (userData: RegisterUser) => {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await db.insert(users).values({
        ...userData,
        password: hashedPassword
    });
}