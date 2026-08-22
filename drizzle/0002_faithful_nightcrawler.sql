ALTER TABLE "cachedJobs" RENAME TO "jobs";--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT "cachedJobs_companyId_companies_id_fk";
--> statement-breakpoint
DROP INDEX "cachedJobsPublishedIdx";--> statement-breakpoint
DROP INDEX "cachedJobsExpiresAtIdx";--> statement-breakpoint
DROP INDEX "cachedJobsIsActiveIdx";--> statement-breakpoint
DROP INDEX "cachedJobsHasRemoteIdx";--> statement-breakpoint
DROP INDEX "cachedJobsCompanyNameIdx";--> statement-breakpoint
DROP INDEX "cachedJobsCompanyIdIdx";--> statement-breakpoint
DROP INDEX "cachedJobsLocationsGinIdx";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "jobId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "source" text DEFAULT 'cleanjobdata' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "externalId" text;--> statement-breakpoint
-- Backfill: pre-migration rows had `id` = CleanJobData's own id (the old
-- cachedJobs.id contract). Every existing row is a synced job, so its old
-- `id` value IS its externalId - copy it over before the unique
-- (source, externalId) index below starts being relied on for sync
-- upserts. New rows post-migration get a real UUID `id` via $defaultFn and
-- a separate `externalId`, per the jobs table's doc comment.
UPDATE "jobs" SET "externalId" = "id" WHERE "externalId" IS NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jobsPublishedIdx" ON "jobs" USING btree ("published");--> statement-breakpoint
CREATE INDEX "jobsExpiresAtIdx" ON "jobs" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "jobsIsActiveIdx" ON "jobs" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "jobsHasRemoteIdx" ON "jobs" USING btree ("hasRemote");--> statement-breakpoint
CREATE INDEX "jobsCompanyNameIdx" ON "jobs" USING btree ("companyName");--> statement-breakpoint
CREATE INDEX "jobsCompanyIdIdx" ON "jobs" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "jobsLocationsGinIdx" ON "jobs" USING gin ("locations");--> statement-breakpoint
CREATE UNIQUE INDEX "jobsSourceExternalIdIdx" ON "jobs" USING btree ("source","externalId");