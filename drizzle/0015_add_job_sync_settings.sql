CREATE TABLE "jobSyncSettings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"syncFilters" jsonb,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
