ALTER TABLE "draft_fees" ADD COLUMN "deposit_date" timestamp;--> statement-breakpoint
ALTER TABLE "draft_fees" ADD COLUMN "deposit_pay_order_number" varchar;--> statement-breakpoint
ALTER TABLE "fees" DROP COLUMN "deposit_slip_number";--> statement-breakpoint
ALTER TABLE "draft_fees" ADD CONSTRAINT "draft_fees_school_code_unique" UNIQUE("school_code");