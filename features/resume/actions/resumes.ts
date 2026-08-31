"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { checkAccess } from "@/features/authGuard";
import { getStorageAdapter } from "@/lib/storage";
import { assertValidUpload, DOCUMENT_UPLOAD_MIME_TYPES } from "@/lib/storage/types";
import featuresConfig from "@/features.config";
import { resumes, type ResumeContent } from "../db/schema";
import { emptyResumeContent, parseResumeText } from "../lib/parse";
import { extractPdfContent } from "../lib/extract";
import { analyseAts, type AtsReport } from "../lib/ats";
import { parseResumeWithAi } from "../lib/ai-parse";

const RESUME_PATH = "/resume";

async function requireUserId(): Promise<string> {
  const access = await checkAccess("resume");
  if (access.status !== "ok") {
    throw new Error("Resumes are disabled or you must sign in to use them.");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

/** Ownership is re-checked on every mutation - a resume id is a UUID, but guessing isn't the threat model; a stale client holding someone else's id is. */
async function requireOwnedResume(userId: string, resumeId: string) {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1);
  if (!row) throw new Error("Resume not found.");
  return row;
}

/** Single-resume, ownership-checked fetch - the `/resume/[id]` preview and edit pages both need exactly this. */
export async function getResume(id: string) {
  const userId = await requireUserId();
  return requireOwnedResume(userId, id);
}

export async function getMyResumes() {
  const userId = await requireUserId();
  const db = requireDb();
  return db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.isDefault), desc(resumes.updatedAt));
}

/**
 * Uploads a resume PDF, extracts its text, and stores a heuristic parse of
 * it alongside the original file.
 *
 * The original is kept deliberately: our parse is best-effort (see
 * lib/parse.ts) and the uploaded file is the artifact the user actually
 * sends to employers, so it is never treated as disposable once parsed.
 *
 * Parsing failures are not fatal - the upload still succeeds with empty
 * content for the user to fill in. A scanned/image-only PDF yields no
 * extractable text at all, and losing the upload over that would be worse
 * than an empty form.
 */
export async function uploadResume(input: { file: File; title?: string }) {
  const userId = await requireUserId();
  const db = requireDb();

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const contentType = input.file.type;
  assertValidUpload({ buffer, contentType }, DOCUMENT_UPLOAD_MIME_TYPES);

  const uploaded = await getStorageAdapter().upload({
    buffer,
    filename: input.file.name,
    contentType,
    scope: "resumes",
    allowedMimeTypes: DOCUMENT_UPLOAD_MIME_TYPES,
  });

  let rawText: string | null = null;
  let content: ResumeContent = emptyResumeContent();
  let atsReport: AtsReport | null = null;
  if (featuresConfig.resume.parsing) {
    try {
      // One extraction pass feeds both the parser and the ATS analysis -
      // they need the same positioned text, and re-reading the PDF twice
      // would just be slower for identical input.
      const pdfContent = await extractPdfContent(buffer);
      atsReport = analyseAts(pdfContent);
      rawText = atsReport.layoutAwareText;
      content = await parseWithBestAvailable(rawText);
    } catch {
      // Keep the upload; leave the parsed fields empty for manual entry.
      rawText = null;
    }
  }

  const existing = await db.select({ id: resumes.id }).from(resumes).where(eq(resumes.userId, userId));

  const [created] = await db
    .insert(resumes)
    .values({
      userId,
      title: input.title?.trim() || input.file.name.replace(/\.pdf$/i, "") || "My resume",
      source: "uploaded" as const,
      fileKey: uploaded.key,
      fileUrl: uploaded.url,
      fileName: input.file.name,
      rawText,
      content,
      atsReport,
      // First resume becomes the default automatically - a user with exactly
      // one resume shouldn't have to also declare it the default.
      isDefault: existing.length === 0,
    })
    .returning();

  revalidatePath(RESUME_PATH);
  if (!created) throw new Error("Failed to create resume.");
  return created;
}

export async function createResume(input: { title: string }) {
  const userId = await requireUserId();
  const db = requireDb();
  const existing = await db.select({ id: resumes.id }).from(resumes).where(eq(resumes.userId, userId));

  const [created] = await db
    .insert(resumes)
    .values({
      userId,
      title: input.title.trim() || "My resume",
      source: "created" as const,
      content: emptyResumeContent(),
      isDefault: existing.length === 0,
    })
    .returning();

  revalidatePath(RESUME_PATH);
  if (!created) throw new Error("Failed to create resume.");
  return created;
}

export async function updateResume(input: { id: string; title?: string; content?: ResumeContent }) {
  const userId = await requireUserId();
  await requireOwnedResume(userId, input.id);
  const db = requireDb();

  await db
    .update(resumes)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      updatedAt: new Date(),
    })
    .where(eq(resumes.id, input.id));

  revalidatePath(RESUME_PATH);
}

/**
 * AI parsing when features.config.ts's resume.aiParsing is on AND a real
 * ANTHROPIC_API_KEY is configured; the heuristic parser otherwise, and as
 * a fallback if the AI call itself comes back empty (parseResumeWithAi
 * never throws - see its doc comment).
 */
async function parseWithBestAvailable(text: string): Promise<ResumeContent> {
  if (featuresConfig.resume.aiParsing) {
    const aiResult = await parseResumeWithAi(text);
    if (aiResult) return aiResult;
  }
  return parseResumeText(text);
}

/**
 * Re-runs the parser over the stored rawText.
 *
 * `rawText` is retained precisely so parser improvements can reach resumes
 * that were uploaded before them - without this, every stored parse stays
 * frozen at whatever the parser did on upload day, and a user sees stale,
 * already-fixed mistakes until they happen to re-upload the same file.
 *
 * Note this re-parses the stored TEXT, not the original PDF: improvements
 * to extraction itself (reading order, wrapped-line joining) need
 * reextractResume() below, which goes back to the file.
 */
export async function reparseResume(id: string) {
  const userId = await requireUserId();
  const row = await requireOwnedResume(userId, id);
  if (!row.rawText) throw new Error("No extracted text to re-parse for this resume.");

  const db = requireDb();
  await db
    .update(resumes)
    .set({ content: await parseWithBestAvailable(row.rawText), updatedAt: new Date() })
    .where(eq(resumes.id, id));

  revalidatePath(RESUME_PATH);
}

/**
 * Re-reads the ORIGINAL uploaded PDF: re-extracts text, re-runs the ATS
 * analysis, and re-parses. This is what picks up extraction-level fixes
 * (column detection, wrapped-line joining), which reparseResume() cannot,
 * since those change the text itself rather than how it's interpreted.
 */
export async function reextractResume(id: string) {
  const userId = await requireUserId();
  const row = await requireOwnedResume(userId, id);
  if (!row.fileKey) throw new Error("This resume has no uploaded file to re-read.");

  const buffer = await getStorageAdapter().read(row.fileKey);
  const pdfContent = await extractPdfContent(buffer);
  const report = analyseAts(pdfContent);

  const db = requireDb();
  await db
    .update(resumes)
    .set({
      rawText: report.layoutAwareText,
      atsReport: report,
      content: await parseWithBestAvailable(report.layoutAwareText),
      updatedAt: new Date(),
    })
    .where(eq(resumes.id, id));

  revalidatePath(RESUME_PATH);
}

export async function setDefaultResume(id: string) {
  const userId = await requireUserId();
  await requireOwnedResume(userId, id);
  const db = requireDb();

  // Clear then set, so "exactly one default" holds even if a previous
  // partial write left two rows flagged.
  await db.update(resumes).set({ isDefault: false }).where(eq(resumes.userId, userId));
  await db.update(resumes).set({ isDefault: true }).where(eq(resumes.id, id));

  revalidatePath(RESUME_PATH);
}

export async function deleteResume(id: string) {
  const userId = await requireUserId();
  const row = await requireOwnedResume(userId, id);
  const db = requireDb();

  if (row.fileKey) {
    // A failed delete here shouldn't block removing the row - an orphaned
    // object in storage is a smaller problem than a resume the user can't
    // get rid of.
    try {
      await getStorageAdapter().delete(row.fileKey);
    } catch {}
  }

  await db.delete(resumes).where(eq(resumes.id, id));

  // If the default was removed, promote the most recent survivor so a user
  // with resumes left always has one marked default.
  if (row.isDefault) {
    const [next] = await db
      .select({ id: resumes.id })
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.updatedAt))
      .limit(1);
    if (next) await db.update(resumes).set({ isDefault: true }).where(eq(resumes.id, next.id));
  }

  revalidatePath(RESUME_PATH);
}
