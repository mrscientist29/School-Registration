ALTER TABLE "fees" ADD COLUMN "deposit_slip_number" varchar;--> statement-breakpoint
ALTER TABLE "fees" ADD COLUMN "deposit_date" timestamp;--> statement-breakpoint
ALTER TABLE "fees" ADD COLUMN "deposit_pay_order_number" varchar;