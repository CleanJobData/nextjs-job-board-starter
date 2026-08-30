CREATE TABLE "jobAlerts" (
	"userId" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"frequency" text DEFAULT 'weekly' NOT NULL,
	"watermark" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSentAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "jobAlerts" ADD CONSTRAINT "jobAlerts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;