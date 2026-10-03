ALTER TABLE "alertSettings" ALTER COLUMN "maxEmailsPerRun" SET DEFAULT 20;--> statement-breakpoint
ALTER TABLE "alertSettings" ADD COLUMN "maxEmailsPerDay" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "alertSettings" ADD COLUMN "dailySentCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "alertSettings" ADD COLUMN "dailyWindowStartedAt" timestamp with time zone DEFAULT now() NOT NULL;