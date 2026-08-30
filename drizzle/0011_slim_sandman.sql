CREATE TABLE "alertSettings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"maxEmailsPerRun" integer DEFAULT 50 NOT NULL,
	"delayBetweenSendsMs" integer DEFAULT 250 NOT NULL,
	"maxJobsPerDigest" integer DEFAULT 10 NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "userPreferences" ADD COLUMN "locations" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "userPreferences" DROP COLUMN "cityIds";--> statement-breakpoint
ALTER TABLE "userPreferences" DROP COLUMN "stateIds";--> statement-breakpoint
ALTER TABLE "userPreferences" DROP COLUMN "countryIds";