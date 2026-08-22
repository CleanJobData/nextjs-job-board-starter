CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"jobId" text NOT NULL,
	"jobTitle" text NOT NULL,
	"companyName" text,
	"jobUrl" text,
	"status" text DEFAULT 'saved' NOT NULL,
	"notes" text,
	"appliedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applicationsUserIdJobIdIdx" ON "applications" USING btree ("userId","jobId");