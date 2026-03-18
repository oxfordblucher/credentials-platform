import { drizzle } from "drizzle-orm/node-postgres";
import users from "../db/users.js";
import { RegisterUser } from "../types/types.js";
import bcrypt from 'bcrypt';

const db = drizzle(process.env.DATABASE_URL!);

export const createUser = async (userData: RegisterUser) => {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const created = await db.insert(users).values({
        ...userData,
        password: hashedPassword
    }).returning({
        id: users.id,
        email: users.email
    });

    return created;
}

export const fetchUser = async (email: string) => {
    const fetched = await db.select({
        id: users.id,
        hash: users.password
    }).from(users)

    return fetched;
}

export const verifyPW = async (input: string, hashed: string) => {
    return bcrypt.compare(input, hashed);
}