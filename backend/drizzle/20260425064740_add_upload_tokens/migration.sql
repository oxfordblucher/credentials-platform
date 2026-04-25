CREATE TABLE "upload_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"credential_type_id" uuid NOT NULL,
	"object_key" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload_tokens" ADD CONSTRAINT "upload_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "upload_tokens" ADD CONSTRAINT "upload_tokens_credential_type_id_credential_types_id_fkey" FOREIGN KEY ("credential_type_id") REFERENCES "credential_types"("id");