ALTER TABLE "job" ADD COLUMN "started_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "step" ADD COLUMN "started_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "step" ADD COLUMN "completed_at" timestamp;