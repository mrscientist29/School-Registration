CREATE TABLE "draft_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" varchar NOT NULL,
	"payment_method" varchar,
	"cheque_number" varchar,
	"cheque_date" timestamp,
	"amount" numeric(10, 2) DEFAULT '20000.00',
	"head_of_institution" varchar,
	"disclaimer_accepted" boolean DEFAULT false,
	"head_signature" varchar,
	"institution_stamp" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "draft_fees_school_code_unique" UNIQUE("school_code")
);
--> statement-breakpoint
CREATE TABLE "draft_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" varchar NOT NULL,
	"primary_teachers" integer,
	"middle_teachers" integer,
	"undergraduate_teachers" integer DEFAULT 0,
	"graduate_teachers" integer DEFAULT 0,
	"postgraduate_teachers" integer DEFAULT 0,
	"education_degree_teachers" integer DEFAULT 0,
	"total_weeks" integer,
	"weekly_periods" integer,
	"period_duration" integer,
	"max_students" integer,
	"facilities" jsonb,
	"other_facility_1" varchar,
	"other_facility_2" varchar,
	"other_facility_3" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "draft_resources_school_code_unique" UNIQUE("school_code")
);
--> statement-breakpoint
CREATE TABLE "draft_schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" varchar NOT NULL,
	"school_name" varchar NOT NULL,
	"school_address" text,
	"contact_numbers" varchar,
	"school_type" varchar,
	"academic_year_start" varchar,
	"academic_year_end" varchar,
	"grade_level_from" varchar,
	"grade_level_till" varchar,
	"languages" jsonb,
	"other_language" varchar,
	"principal_name" varchar,
	"principal_email" varchar,
	"principal_cell" varchar,
	"primary_coordinator_name" varchar,
	"primary_coordinator_email" varchar,
	"primary_coordinator_cell" varchar,
	"middle_coordinator_name" varchar,
	"middle_coordinator_email" varchar,
	"middle_coordinator_cell" varchar,
	"grade_iv" integer DEFAULT 0,
	"grade_v" integer DEFAULT 0,
	"grade_vi" integer DEFAULT 0,
	"grade_vii" integer DEFAULT 0,
	"grade_viii" integer DEFAULT 0,
	"psp_msp_registration" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "draft_schools_school_code_unique" UNIQUE("school_code")
);
--> statement-breakpoint
CREATE TABLE "fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" varchar NOT NULL,
	"payment_method" varchar,
	"cheque_number" varchar,
	"cheque_date" timestamp,
	"amount" numeric(10, 2) DEFAULT '20000.00',
	"head_of_institution" varchar,
	"disclaimer_accepted" boolean DEFAULT false,
	"head_signature" varchar,
	"institution_stamp" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" varchar NOT NULL,
	"primary_teachers" integer,
	"middle_teachers" integer,
	"undergraduate_teachers" integer DEFAULT 0,
	"graduate_teachers" integer DEFAULT 0,
	"postgraduate_teachers" integer DEFAULT 0,
	"education_degree_teachers" integer DEFAULT 0,
	"total_weeks" integer,
	"weekly_periods" integer,
	"period_duration" integer,
	"max_students" integer,
	"facilities" jsonb,
	"other_facility_1" varchar,
	"other_facility_2" varchar,
	"other_facility_3" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" varchar NOT NULL,
	"username" varchar NOT NULL,
	"password" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "school_credentials_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" varchar NOT NULL,
	"school_name" varchar NOT NULL,
	"school_address" text,
	"contact_numbers" varchar,
	"school_type" varchar,
	"academic_year_start" varchar,
	"academic_year_end" varchar,
	"grade_level_from" varchar,
	"grade_level_till" varchar,
	"languages" jsonb,
	"other_language" varchar,
	"principal_name" varchar,
	"principal_email" varchar,
	"principal_cell" varchar,
	"primary_coordinator_name" varchar,
	"primary_coordinator_email" varchar,
	"primary_coordinator_cell" varchar,
	"middle_coordinator_name" varchar,
	"middle_coordinator_email" varchar,
	"middle_coordinator_cell" varchar,
	"grade_iv" integer DEFAULT 0,
	"grade_v" integer DEFAULT 0,
	"grade_vi" integer DEFAULT 0,
	"grade_vii" integer DEFAULT 0,
	"grade_viii" integer DEFAULT 0,
	"psp_msp_registration" jsonb,
	"is_active" boolean DEFAULT true,
	"registration_completed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "schools_school_code_unique" UNIQUE("school_code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'admin',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "draft_fees" ADD CONSTRAINT "draft_fees_school_code_draft_schools_school_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."draft_schools"("school_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_resources" ADD CONSTRAINT "draft_resources_school_code_draft_schools_school_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."draft_schools"("school_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees" ADD CONSTRAINT "fees_school_code_schools_school_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("school_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_school_code_schools_school_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("school_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_credentials" ADD CONSTRAINT "school_credentials_school_code_schools_school_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("school_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");