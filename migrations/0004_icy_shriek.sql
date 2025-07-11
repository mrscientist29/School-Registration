CREATE TABLE "student_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" varchar NOT NULL,
	"payment_method" varchar,
	"cheque_number" varchar,
	"cheque_date" timestamp,
	"deposit_slip_number" varchar,
	"deposit_date" timestamp,
	"deposit_pay_order_number" varchar,
	"total_amount" numeric(10, 2),
	"primary_amount" numeric(10, 2) DEFAULT '0.00',
	"middle_amount" numeric(10, 2) DEFAULT '0.00',
	"primary_candidates" integer DEFAULT 0,
	"middle_candidates" integer DEFAULT 0,
	"head_of_institution" varchar,
	"disclaimer_accepted" boolean DEFAULT false NOT NULL,
	"head_signature" varchar,
	"institution_stamp" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar NOT NULL,
	"school_code" varchar NOT NULL,
	"student_name" varchar NOT NULL,
	"father_name" varchar NOT NULL,
	"gender" varchar NOT NULL,
	"date_of_birth" timestamp NOT NULL,
	"grade" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
ALTER TABLE "draft_fees" ALTER COLUMN "disclaimer_accepted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "fees" ALTER COLUMN "disclaimer_accepted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_school_code_schools_school_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("school_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_school_code_schools_school_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("school_code") ON DELETE no action ON UPDATE no action;