CREATE TYPE "role" AS ENUM('member', 'manager');--> statement-breakpoint
CREATE TYPE "org_role" AS ENUM('admin', 'owner');--> statement-breakpoint
CREATE TYPE "credential_status" AS ENUM('pending', 'active', 'rejected', 'expired', 'revoked');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"dob" date NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"pending_email" varchar(255) UNIQUE,
	"password" text NOT NULL,
	"org_id" uuid NOT NULL,
	"org_role" "org_role",
	"created" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"user_id" uuid,
	"team_id" uuid,
	"role" "role" NOT NULL,
	"joined" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_pkey" PRIMARY KEY("user_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"org_id" uuid NOT NULL,
	"manager_id" uuid,
	"name" varchar(100),
	"description" text,
	"created" timestamp DEFAULT now() NOT NULL,
	"deleted" timestamp
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" uuid,
	"name" varchar(100) NOT NULL,
	"address" varchar(255) NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"agent" varchar(512),
	"device" varchar(100),
	"ip" varchar(45),
	"created" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	"expiration" timestamp DEFAULT NOW() + INTERVAL '7d' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credential_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"credential_id" uuid NOT NULL,
	"from_status" "credential_status",
	"to_status" "credential_status" NOT NULL,
	"actor_id" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "credential_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"org_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"metadata_schema" jsonb DEFAULT '{}' NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"deactivated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rejection_reasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_credentials" (
	"team_id" uuid,
	"credential_id" uuid,
	CONSTRAINT "team_credentials_pkey" PRIMARY KEY("team_id","credential_id")
);
--> statement-breakpoint
CREATE TABLE "user_credentials" (
	"user_id" uuid,
	"credential_id" uuid,
	"verifier_id" uuid,
	"revoker_id" uuid,
	"file_key" varchar(255),
	"submitted" timestamp DEFAULT now() NOT NULL,
	"verified" timestamp,
	"expiration" timestamp,
	"revocation" timestamp,
	"status" "credential_status" DEFAULT 'pending'::"credential_status" NOT NULL,
	"submitted_metadata" jsonb,
	"verified_metadata" jsonb,
	"expiration_date" timestamp,
	"next_alert_at" timestamp,
	"rejection_reason_id" uuid,
	"review_notes" text,
	CONSTRAINT "user_credentials_pkey" PRIMARY KEY("user_id","credential_id")
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL UNIQUE,
	"org_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"role" "role",
	"token" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"inviter_id" uuid NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"expiration" timestamp DEFAULT now() + INTERVAL '7d' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "notification_idx" ON "notifications" USING gin ("payload" jsonb_path_ops);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "credential_audit_log" ADD CONSTRAINT "credential_audit_log_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "credential_audit_log" ADD CONSTRAINT "credential_audit_log_credential_id_credential_types_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credential_types"("id");--> statement-breakpoint
ALTER TABLE "credential_types" ADD CONSTRAINT "credential_types_org_id_organizations_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "team_credentials" ADD CONSTRAINT "team_credentials_credential_id_credential_types_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credential_types"("id");--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_verifier_id_users_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_revoker_id_users_id_fkey" FOREIGN KEY ("revoker_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_org_id_users_id_fkey" FOREIGN KEY ("org_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id");--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_inviter_id_users_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");