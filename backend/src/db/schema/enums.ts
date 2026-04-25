import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum('role', ['member', 'manager']);

export const orgRoleEnum = pgEnum('org_role', ['admin', 'owner']);