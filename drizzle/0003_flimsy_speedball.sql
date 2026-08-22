ALTER TABLE "companies" ADD COLUMN "source" text DEFAULT 'cleanjobdata' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "externalId" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "ownerId" text;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Backfill: pre-migration rows had `id` = CleanJobData's own employer id
-- (the old companies.id contract). Every existing row is a synced company,
-- so its old `id` value IS its externalId - copy it over before the unique
-- (source, externalId) index below starts being relied on for sync
-- upserts. New rows post-migration get a real UUID `id` via $defaultFn and
-- a separate `externalId`, per the companies table's doc comment.
UPDATE "companies" SET "externalId" = "id" WHERE "externalId" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "companiesSourceExternalIdIdx" ON "companies" USING btree ("source","externalId");