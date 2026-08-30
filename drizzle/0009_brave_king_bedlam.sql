CREATE TABLE "userPreferences" (
	"userId" text PRIMARY KEY NOT NULL,
	"titles" text[] DEFAULT '{}' NOT NULL,
	"cityIds" integer[] DEFAULT '{}' NOT NULL,
	"stateIds" integer[] DEFAULT '{}' NOT NULL,
	"countryIds" integer[] DEFAULT '{}' NOT NULL,
	"remoteOnly" boolean DEFAULT false NOT NULL,
	"experienceLevels" text[] DEFAULT '{}' NOT NULL,
	"minSalary" integer,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboardedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "userPreferences" ADD CONSTRAINT "userPreferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;