ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "status" text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "requiresVerification" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "jobsStatusIdx" ON "jobs" USING btree ("status");