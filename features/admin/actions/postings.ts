"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { requireAdmin } from "@/features/authGuard";
import { jobs, companies } from "@/features/job-sync/db/schema";

const ADMIN_POSTINGS_PATH = "/admin/postings";

async function requireAdminAccess() {
  const access = await requireAdmin();
  if (access.status !== "ok") {
    throw new Error("Admin access required.");
  }
}

export type AdminPostingRow = {
  id: string;
  title: string;
  companyName: string | null;
  applicationUrl: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  published: string;
};

/**
 * All source="posted" jobs, optionally filtered by status. NO status
 * filter applied when `status` is omitted - this is the admin-only,
 * unfiltered read path the phase 3 spec calls for (every other jobs query
 * in the app either hard-filters to status="approved" for public view, or
 * to the current user's own postings). Defaults to "pending" at the call
 * site (the moderation queue page), not here, so this function stays a
 * plain reusable query.
 */
export async function listPostingsForAdmin(status?: "pending" | "approved" | "rejected"): Promise<AdminPostingRow[]> {
  await requireAdminAccess();
  const db = requireDb();

  const conditions = [eq(jobs.source, "posted")];
  if (status) conditions.push(eq(jobs.status, status));

  const rows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      companyName: jobs.companyName,
      applicationUrl: jobs.applicationUrl,
      status: jobs.status,
      rejectionReason: jobs.rejectionReason,
      published: jobs.published,
    })
    .from(jobs)
    .where(and(...conditions))
    .orderBy(desc(jobs.published));

  return rows.map((r) => ({ ...r, published: r.published.toISOString() }));
}

export type AdminPostingDetail = AdminPostingRow & {
  description: string | null;
  locationText: string | null;
  employmentType: string | null;
  hasRemote: boolean;
  salaryText: string | null;
  posterEmail: string | null;
};

/**
 * Admin-only single-posting read with NO status filter - the exact gap the
 * phase 3 spec calls out (getPostedJobById() in job-sync/lib/read.ts only
 * ever resolves status="approved", by design, for the public route). Joins
 * through companies.ownerId to surface the poster's email for moderation
 * context; a company with no owner yet (unclaimed) just shows null.
 */
export async function getPostingForAdmin(id: string): Promise<AdminPostingDetail | null> {
  await requireAdminAccess();
  const db = requireDb();

  const { users } = await import("@/features/auth/db/schema");
  const [row] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      companyName: jobs.companyName,
      applicationUrl: jobs.applicationUrl,
      status: jobs.status,
      rejectionReason: jobs.rejectionReason,
      published: jobs.published,
      description: jobs.description,
      locationText: jobs.locationText,
      employmentType: jobs.employmentType,
      hasRemote: jobs.hasRemote,
      salaryText: jobs.salaryText,
      posterEmail: users.email,
    })
    .from(jobs)
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .leftJoin(users, eq(companies.ownerId, users.id))
    .where(and(eq(jobs.id, id), eq(jobs.source, "posted")))
    .limit(1);

  if (!row) return null;
  return { ...row, published: row.published.toISOString() };
}

/**
 * status="approved". Immediately visible: getPostedJobById() (job-sync/lib/
 * read.ts) re-queries `status="approved"` on every request - nothing caches
 * a prior "not found" result at the data layer, so the next request after
 * this UPDATE commits sees the row. We still revalidatePath() the job's own
 * /jobs/[id] route (an RSC full-route cache CAN exist on top of that) plus
 * the homepage feed and this admin queue.
 */
export async function approvePosting(id: string) {
  await requireAdminAccess();
  const db = requireDb();

  await db
    .update(jobs)
    .set({ status: "approved" as const, rejectionReason: null })
    .where(and(eq(jobs.id, id), eq(jobs.source, "posted")));

  revalidatePath(ADMIN_POSTINGS_PATH);
  revalidatePath("/");
  revalidatePath(`/jobs/${id}`);
}

/** status="rejected", with an optional reason surfaced back to the poster on their own "My postings" dashboard (jobs.rejectionReason - see that column's doc comment). */
export async function rejectPosting(id: string, reason?: string) {
  await requireAdminAccess();
  const db = requireDb();

  await db
    .update(jobs)
    .set({ status: "rejected" as const, rejectionReason: reason?.trim() || null })
    .where(and(eq(jobs.id, id), eq(jobs.source, "posted")));

  revalidatePath(ADMIN_POSTINGS_PATH);
  revalidatePath("/");
  revalidatePath(`/jobs/${id}`);
}
