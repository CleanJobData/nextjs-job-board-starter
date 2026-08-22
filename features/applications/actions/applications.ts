"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { checkAccess } from "@/features/authGuard";
import { jobs } from "@/features/job-sync/db/schema";
import { applications } from "../db/schema";

const APPLICATIONS_PATH = "/applications";

async function requireUserId(): Promise<string> {
  const access = await checkAccess("applications");
  if (access.status !== "ok") {
    throw new Error("Applications feature is disabled or you must sign in to use it.");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("You must sign in to track applications.");
  }
  return userId;
}

export type TrackApplicationInput = {
  jobId: string;
  jobTitle: string;
  companyName?: string | null;
  jobUrl?: string | null;
};

/**
 * Tracks a job, or updates the existing tracked row if this user already
 * tracked this jobId (see the unique index on (userId, jobId)).
 *
 * `input.jobId` is the CleanJobData EXTERNAL id (TrackApplicationButton's
 * callers, e.g. JobDetailTrackAction, pass job.id straight from the
 * CleanJobData API shape) - NOT jobs.id, which is now an internal UUID
 * decoupled from that id space (see jobs table's doc comment in
 * features/job-sync/db/schema.ts). So we resolve it to the internal id via
 * (source: "cleanjobdata", externalId) before inserting.
 *
 * If no matching row is found - job-sync disabled, or the job just hasn't
 * been synced yet - we deliberately do NOT throw or fabricate a `jobs` row
 * (we only have jobId/jobTitle/companyName/jobUrl here, not a full job
 * record). We fall back to storing jobId: null and rely purely on the
 * jobTitle/companyName/jobUrl snapshot - applications must keep working
 * even when job-sync is off.
 */
export async function trackApplication(input: TrackApplicationInput) {
  const userId = await requireUserId();
  const db = requireDb();

  const [matchedJob] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.source, "cleanjobdata"), eq(jobs.externalId, input.jobId)))
    .limit(1);

  const row = {
    userId,
    jobId: matchedJob?.id ?? null,
    jobTitle: input.jobTitle,
    companyName: input.companyName ?? null,
    jobUrl: input.jobUrl ?? null,
    updatedAt: new Date(),
  };

  await db
    .insert(applications)
    .values({ ...row, status: "saved" as const })
    .onConflictDoUpdate({
      target: [applications.userId, applications.jobId],
      set: row,
    });

  revalidatePath(APPLICATIONS_PATH);
}

export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected" | "withdrawn";

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const userId = await requireUserId();
  const db = requireDb();

  await db
    .update(applications)
    .set({
      status,
      appliedAt: status === "applied" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)));

  revalidatePath(APPLICATIONS_PATH);
}

export async function updateApplicationNotes(id: string, notes: string) {
  const userId = await requireUserId();
  const db = requireDb();

  await db
    .update(applications)
    .set({ notes, updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)));

  revalidatePath(APPLICATIONS_PATH);
}

export async function deleteApplication(id: string) {
  const userId = await requireUserId();
  const db = requireDb();

  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, userId)));

  revalidatePath(APPLICATIONS_PATH);
}
