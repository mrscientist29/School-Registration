CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar NOT NULL,
	"user_id" varchar,
	"username" varchar,
	"ip_address" varchar,
	"user_agent" text,
	"resource" varchar,
	"resource_id" varchar,
	"old_data" jsonb,
	"new_data" jsonb,
	"details" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"session_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "fees" ADD COLUMN "payment_screenshot" varchar;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "payment_screenshot" varchar;