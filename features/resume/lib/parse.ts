import { extractText, getDocumentProxy } from "unpdf";
import type { ResumeContent } from "../db/schema";

/**
 * PDF only in v1. DOCX would mean a second extraction library (mammoth) and
 * a second set of quirks, and PDF is what the overwhelming majority of
 * resumes are actually sent as - so it's scoped out rather than
 * half-supported. lib/storage/types.ts's DOCUMENT_UPLOAD_MIME_TYPES is the
 * matching allow-list.
 *
 * unpdf over pdf-parse: pdf-parse reads a bundled test file at import time
 * (a long-standing packaging quirk that breaks in bundled/serverless
 * environments), while unpdf ships a serverless-friendly pdfjs build with
 * no native dependencies.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  // mergePages: true makes unpdf return a single string; the runtime check
  // stays because the union type differs across unpdf versions.
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_RE = /\bhttps?:\/\/[^\s)]+|\b(?:www\.|linkedin\.com|github\.com)[^\s)]+/gi;

/** Headings we treat as section boundaries. Matched case-insensitively on a line of its own. */
const SECTION_PATTERNS: { key: keyof SectionBuckets; re: RegExp }[] = [
  { key: "summary", re: /^(summary|profile|about|objective)\b/i },
  { key: "skills", re: /^(skills|technical skills|technologies|competencies)\b/i },
  { key: "experience", re: /^(experience|work experience|employment|professional experience)\b/i },
  { key: "education", re: /^(education|academic background|qualifications)\b/i },
];

type SectionBuckets = {
  summary: string[];
  skills: string[];
  experience: string[];
  education: string[];
  other: string[];
};

function splitSections(lines: string[]): SectionBuckets {
  const buckets: SectionBuckets = { summary: [], skills: [], experience: [], education: [], other: [] };
  let current: keyof SectionBuckets = "other";

  for (const line of lines) {
    const heading = SECTION_PATTERNS.find((p) => p.re.test(line.trim()));
    if (heading && line.trim().length < 60) {
      current = heading.key;
      continue;
    }
    buckets[current].push(line);
  }
  return buckets;
}

const DATE_RE = /((19|20)\d{2}|present|current)/i;

/**
 * Splits an experience/education block into entries, anchored on date
 * ranges.
 *
 * Two simpler rules were tried and both failed on real extracted text:
 * blank lines don't survive PDF extraction (every job merged into one),
 * and "a non-date line after a date starts a new entry" wrongly treats the
 * description under a job as the next job's title. Resume entries do
 * reliably carry a date range though, so each date line anchors one entry:
 * the 1-2 lines directly above it are its title/company, and the lines
 * after it are its description, up to where the next entry's header
 * begins.
 *
 * Still a heuristic - unusual layouts will mis-group, which is exactly why
 * every parsed field lands in an editable form rather than being treated
 * as final. Parsing is a head start, not an authority.
 */
const HEADER_LOOKBACK = 2;

function groupEntries(lines: string[]): string[][] {
  const clean = lines.map((l) => l.trim()).filter(Boolean);
  const dateIdx = clean.map((l, i) => (DATE_RE.test(l) ? i : -1)).filter((i) => i >= 0);

  // No dates at all - fall back to treating the whole block as one entry
  // rather than inventing boundaries that aren't there.
  if (dateIdx.length === 0) return clean.length ? [clean] : [];

  return dateIdx
    .map((d, n) => {
      const prevDate = n === 0 ? -1 : dateIdx[n - 1]!;
      const headerStart = Math.max(prevDate + 1, d - HEADER_LOOKBACK);
      const nextDate = dateIdx[n + 1];
      // Stop before the next entry's header lines, not at its date line.
      const end = nextDate === undefined ? clean.length : Math.max(d + 1, nextDate - HEADER_LOOKBACK);
      const header = clean.slice(headerStart, d);
      const description = clean.slice(d + 1, end);
      return [...header, clean[d]!, ...description];
    })
    .filter((e) => e.join("").trim().length > 0);
}

function toExperience(entry: string[]) {
  const dateAt = entry.findIndex((l) => DATE_RE.test(l));
  const header = dateAt >= 0 ? entry.slice(0, dateAt) : entry.slice(0, 2);
  const description = dateAt >= 0 ? entry.slice(dateAt + 1) : entry.slice(2);
  return {
    title: header[0]?.trim() || null,
    company: header[1]?.trim() || null,
    dates: dateAt >= 0 ? entry[dateAt]!.trim() : null,
    description: description.join(" ").trim() || null,
  };
}

function toEducation(entry: string[]) {
  const dateAt = entry.findIndex((l) => DATE_RE.test(l));
  const header = dateAt >= 0 ? entry.slice(0, dateAt) : entry.slice(0, 2);
  return {
    school: header[0]?.trim() || null,
    degree: header[1]?.trim() || null,
    dates: dateAt >= 0 ? entry[dateAt]!.trim() : null,
  };
}

/**
 * Best-effort structured extraction from raw resume text.
 *
 * Heuristic by design: there is no standard resume format, so this cannot
 * be reliable in the way a schema-backed parser is. The contract with the
 * UI is that everything it returns is a pre-filled DRAFT the user reviews
 * and corrects.
 *
 * features.config.ts's `resume.aiParsing` flag exists for an LLM-assisted
 * path that would do markedly better on unusual layouts; it is deliberately
 * not implemented here, since it needs a provider choice and its own API
 * key. This function is the seam it would slot in behind.
 */
export function parseResumeText(text: string): ResumeContent {
  const lines = text.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim());

  const email = text.match(EMAIL_RE)?.[0] ?? null;
  const phone = text.match(PHONE_RE)?.[0]?.trim() ?? null;
  const links = Array.from(new Set(text.match(URL_RE) ?? [])).slice(0, 5);

  // The name is the first line that isn't itself contact details - resumes
  // almost always lead with it.
  const name =
    nonEmpty.find((l) => {
      const t = l.trim();
      if (!t || t.length > 60) return false;
      if (EMAIL_RE.test(t) || PHONE_RE.test(t)) return false;
      if (/^https?:|www\./i.test(t)) return false;
      return /[a-z]/i.test(t);
    })?.trim() ?? null;

  const sections = splitSections(lines);

  const skills = sections.skills
    .join(",")
    .split(/[,•|•\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40)
    .slice(0, 40);

  return {
    contact: { name, email, phone, location: null, links },
    summary: sections.summary.join(" ").trim() || null,
    skills,
    experience: groupEntries(sections.experience).slice(0, 15).map(toExperience),
    education: groupEntries(sections.education).slice(0, 10).map(toEducation),
  };
}

export const emptyResumeContent = (): ResumeContent => ({
  contact: { name: null, email: null, phone: null, location: null, links: [] },
  summary: null,
  skills: [],
  experience: [],
  education: [],
});
