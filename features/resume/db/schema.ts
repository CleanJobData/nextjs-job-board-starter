import { pgTable, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "@/features/auth/db/schema";

/** The structured shape both parsing and the builder produce - see lib/parse.ts. */
export type ResumeContact = {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: string[];
};

export type ResumeExperience = {
  company: string | null;
  title: string | null;
  dates: string | null;
  description: string | null;
};

export type ResumeEducation = {
  school: string | null;
  degree: string | null;
  dates: string | null;
};

export type ResumeContent = {
  contact: ResumeContact;
  summary: string | null;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
};

/**
 * One row per resume a user owns. A user can keep several (a general one, a
 * role-specific one) and mark one default.
 *
 * `source` distinguishes the two ways a row gets here: "uploaded" (a PDF was
 * uploaded, text extracted, then heuristically parsed) or "created" (built
 * from scratch in the app, no file). It matters because an uploaded resume
 * has a `fileKey`/`fileUrl` worth keeping - the original is the thing the
 * user actually sends to employers, and our parse of it is only ever a
 * best-effort interpretation, never a replacement.
 *
 * `content` is JSONB rather than a spread of columns: it's deeply nested
 * arrays-of-objects (experience, education), never filtered or sorted
 * across rows, and always read whole for one user - exactly the case this
 * codebase already reserves JSONB for (see jobs.locations' doc comment).
 *
 * `rawText` keeps the extracted text even after parsing, so the parser can
 * be improved and re-run over existing resumes without asking anyone to
 * re-upload.
 */
export const resumes = pgTable(
  "resumes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    source: text("source").$type<"uploaded" | "created">().notNull(),
    /** Storage key + URL of the original upload, null for resumes built in-app. */
    fileKey: text("fileKey"),
    fileUrl: text("fileUrl"),
    fileName: text("fileName"),
    rawText: text("rawText"),
    content: jsonb("content").$type<ResumeContent>().notNull(),
    isDefault: boolean("isDefault").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("resumesUserIdIdx").on(t.userId)]
);
