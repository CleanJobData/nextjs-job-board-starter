"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { checkAccess } from "@/features/authGuard";
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

/** Tracks a job, or updates the existing tracked row if this user already tracked this jobId (see the unique index on (userId, jobId)). */
export async function trackApplication(input: TrackApplicationInput) {
  const userId = await requireUserId();
  const db = requireDb();

  const row = {
    userId,
    jobId: input.jobId,
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
