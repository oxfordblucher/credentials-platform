import { pgTable, text, varchar, uuid, timestamp, primaryKey, pgEnum, jsonb, integer } from "drizzle-orm/pg-core";
import { orgs } from "./orgs.js";
import { users } from "./users.js";
export const credEnum = pgEnum('credential_status', ['pending', 'active', 'rejected', 'expired', 'revoked']);
export const credentialTypes = pgTable("credential_types", {
    id: uuid().primaryKey().defaultRandom(),
    org_id: uuid().notNull().references(() => orgs.id),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    metadata_schema: jsonb().notNull().default({}),
    schema_version: integer().notNull().default(1),
    deactivated_at: timestamp()
});
export const teamCredentials = pgTable("team_credentials", {
    team_id: uuid().notNull(),
    credential_id: uuid().notNull().references(() => credentialTypes.id)
}, (t) => [primaryKey({ columns: [t.team_id, t.credential_id] })]);
export const userCredentials = pgTable("user_credentials", {
    user_id: uuid().notNull(),
    credential_id: uuid().notNull(),
    verifier_id: uuid().references(() => users.id),
    revoker_id: uuid().references(() => users.id),
    file_key: varchar({ length: 255 }),
    submitted: timestamp().notNull().defaultNow(),
    verified: timestamp(),
    expiration: timestamp(),
    revocation: timestamp(),
    status: credEnum().notNull().default('pending'),
    submitted_metadata: jsonb(),
    verified_metadata: jsonb(),
    expiration_date: timestamp(),
    next_alert_at: timestamp(),
    rejection_reason_id: uuid(),
    review_notes: text()
}, (t) => [primaryKey({ columns: [t.user_id, t.credential_id] })]);
export const rejectionReasons = pgTable("rejection_reasons", {
    id: uuid().primaryKey().defaultRandom(),
    code: varchar({ length: 50 }).notNull(),
    label: varchar({ length: 100 }).notNull()
});
// credential_audit_log is strictly append-only. Rows must never be updated or deleted.
export const credentialAuditLog = pgTable("credential_audit_log", {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid().notNull().references(() => users.id),
    credential_id: uuid().notNull().references(() => credentialTypes.id),
    from_status: credEnum(),
    to_status: credEnum().notNull(),
    actor_id: uuid().notNull(),
    timestamp: timestamp().notNull().defaultNow(),
    notes: text()
});
