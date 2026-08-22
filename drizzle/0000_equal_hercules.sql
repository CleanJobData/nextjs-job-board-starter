CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	"passwordHash" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "cachedJobs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"companyId" text,
	"companyName" text,
	"locationText" text,
	"locations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"applicationUrl" text,
	"language" text,
	"employmentType" text,
	"hasRemote" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"sourceExpiredAt" timestamp with time zone,
	"experienceLevel" text,
	"experienceLevels" text[] DEFAULT '{}' NOT NULL,
	"salaryMin" integer,
	"salaryMax" integer,
	"salaryCurrency" text,
	"salaryText" text,
	"published" timestamp with time zone NOT NULL,
	"syncedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo" text,
	"websiteUrl" text,
	"linkedinUrl" text,
	"twitterUrl" text,
	"githubUrl" text,
	"youtubeUrl" text,
	"facebookUrl" text,
	"instagramUrl" text,
	"team" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"employeeCount" text,
	"industry" text,
	"headquarters" text,
	"founded" integer,
	"specialties" text[] DEFAULT '{}' NOT NULL,
	"location" text,
	"registrableDomain" text,
	"sourceLastScrapedAt" timestamp with time zone,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "syncRuns" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"finishedAt" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"watermark" timestamp with time zone,
	"jobsUpserted" integer DEFAULT 0 NOT NULL,
	"jobsExpired" integer DEFAULT 0 NOT NULL,
	"errorMessage" text
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cachedJobs" ADD CONSTRAINT "cachedJobs_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accountsUserIdIdx" ON "accounts" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sessionsUserIdIdx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cachedJobsPublishedIdx" ON "cachedJobs" USING btree ("published");--> statement-breakpoint
CREATE INDEX "cachedJobsExpiresAtIdx" ON "cachedJobs" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "cachedJobsIsActiveIdx" ON "cachedJobs" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "cachedJobsHasRemoteIdx" ON "cachedJobs" USING btree ("hasRemote");--> statement-breakpoint
CREATE INDEX "cachedJobsCompanyNameIdx" ON "cachedJobs" USING btree ("companyName");--> statement-breakpoint
CREATE INDEX "cachedJobsCompanyIdIdx" ON "cachedJobs" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "cachedJobsLocationsGinIdx" ON "cachedJobs" USING gin ("locations");--> statement-breakpoint
CREATE INDEX "syncRunsKindStartedAtIdx" ON "syncRuns" USING btree ("kind","startedAt");