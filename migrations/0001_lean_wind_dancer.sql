ALTER TABLE "draft_fees" DROP CONSTRAINT "draft_fees_school_code_unique";--> statement-breakpoint
ALTER TABLE "draft_fees" ADD COLUMN "deposit_slip_number" varchar;--> statement-breakpoint
ALTER TABLE "fees" ADD COLUMN "deposit_slip_number" varchar;