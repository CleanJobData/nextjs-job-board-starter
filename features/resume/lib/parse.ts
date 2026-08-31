import type { ResumeContent } from "../db/schema";
import { extractLayoutAwareText, extractPdfContent } from "./extract";

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
  // Layout-aware, not unpdf's flat extractText(): on a multi-column CV the
  // flat version interleaves the sidebar into the main body line by line,
  // which is what made a project appear under "Summary" and a language
  // under "Education". Reading order is reconstructed from geometry first
  // so every parser downstream - heuristic or AI - sees the CV the way a
  // human reads it. See lib/extract.ts.
  const content = await extractPdfContent(buffer);
  return extractLayoutAwareText(content);
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_RE = /\bhttps?:\/\/[^\s)]+|\b(?:www\.|linkedin\.com|github\.com)[^\s)]+/gi;

/** Headings we treat as section boundaries. Matched case-insensitively on a line of its own. */
const SECTION_PATTERNS: { key: keyof SectionBuckets; re: RegExp }[] = [
  { key: "summary", re: /^(summary|profile|about( me)?|objective|personal statement|overview)\b/i },
  {
    key: "skills",
    re: /^(skills?|technical skills?|core skills?|technolog(y|ies)|tech stack|competenc(y|ies)|expertise|proficienc(y|ies))\b/i,
  },
  {
    key: "experience",
    // NOTE the trailing `s?` on every noun. Real headings are pluralised
    // ("Work Experiences", "Projects") and a bare `experience\b` silently
    // fails on them - the whole section then flows into whichever bucket
    // was open, which is how a CV's entire work history ended up filed as
    // skills and the experience list came back empty.
    re: /^(work\s+)?(experiences?|employment( history)?|professional experiences?|careers?|work histor(y|ies)|positions?|professional backgrounds?)\b/i,
  },
  {
    key: "education",
    re: /^(education(al)?|academics?|academic background|qualifications?|degrees?)\b/i,
  },
  {
    key: "projects",
    re: /^((personal|side|selected|key|notable)\s+)?projects?\b/i,
  },
  // Recognised ONLY so they stop absorbing into the section above them.
  {
    key: "other",
    re: /^(portfolios?|publications?|certifications?|certificates?|licen[cs]es?|awards?|honou?rs?|languages?|interests?|hobb(y|ies)|volunteer(ing)?|references?|online profiles?|profiles?|links?|contacts?|activit(y|ies)|courses?|trainings?)\b/i,
  },
];

type SectionBuckets = {
  summary: string[];
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  /**
   * Recognised-but-unmodelled sections (certifications, languages,
   * profiles...) - one group per heading, not flattened together, so the
   * heading text survives into ResumeContent.additionalSections instead of
   * being kept only to stop it bleeding into the section above.
   */
  other: { heading: string; lines: string[] }[];
  /** Anything before the first recognised heading - name, contact block, and usually an unlabelled summary. */
  preamble: string[];
};

/**
 * A section heading is a line that ONLY names the section. A line like
 * "Technologies: Next.js, Node.js, MongoDB" inside a job entry matches the
 * skills heading pattern but is a label with its own value - treating it
 * as a heading truncated the experience section at the first job and
 * flushed every later role into skills.
 */
function isStandaloneHeading(line: string): boolean {
  const colon = line.indexOf(":");
  // Content after the colon means it's "label: value", not a heading.
  if (colon !== -1 && line.slice(colon + 1).trim().length > 0) return false;

  const text = colon === -1 ? line : line.slice(0, colon);
  const words = text.trim().split(/\s+/).filter(Boolean);

  // A real heading is a short, capitalised label. A wrapped body line can
  // easily BEGIN with a section keyword - "summary preferences with a
  // real-time preview" is a continuation of a bullet, not a Summary
  // heading, and treating it as one dumped the rest of the CV into the
  // summary field.
  if (words.length === 0 || words.length > 5) return false;

  const first = words[0]!;
  const startsCapitalised = /^[A-Z]/.test(first);
  const allCaps = text === text.toUpperCase();
  if (!startsCapitalised && !allCaps) return false;

  // Sentence punctuation is body text, never a heading.
  return !/[.,;]$/.test(text.trim());
}

function splitSections(lines: string[]): SectionBuckets {
  const buckets: SectionBuckets = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    other: [],
    preamble: [],
  };
  // Starts in `preamble`, not `other`: everything above the first heading
  // is the contact block and, on most CVs, an unlabelled summary paragraph.
  let current: keyof SectionBuckets = "preamble";

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = SECTION_PATTERNS.find((p) => p.re.test(trimmed));
    if (heading && trimmed.length < 60 && isStandaloneHeading(trimmed)) {
      current = heading.key;
      if (heading.key === "other") buckets.other.push({ heading: trimmed, lines: [] });
      continue;
    }
    if (current === "other") {
      // A body line before any "other" heading has been seen shouldn't
      // happen (current starts in "preamble"), but guard it anyway rather
      // than throwing on a malformed group.
      if (buckets.other.length === 0) buckets.other.push({ heading: "Other", lines: [] });
      buckets.other[buckets.other.length - 1]!.lines.push(line);
    } else {
      buckets[current].push(line);
    }
  }
  return buckets;
}

const DATE_RE = /((19|20)\d{2}|present|current)/i;

/**
 * Leading list markers, normalised to a single "- " so downstream
 * renderers have one thing to detect.
 *
 * PDF text extraction is wildly inconsistent about bullets: the same
 * visual dot comes out as U+2022, U+25AA, U+2023, a hyphen, an asterisk,
 * or - when the source font's encoding doesn't survive - plain mojibake
 * like a stray quote. Matching a broad set and rewriting to one canonical
 * marker is more robust than trying to preserve whatever arrived.
 */
const BULLET_PREFIX_RE = /^\s*([•▪‣·◦●○∙*+\-–—"'"]|\u2022|\u25AA)\s+/;

function normaliseBulletLine(line: string): string {
  const trimmed = line.trim();
  return BULLET_PREFIX_RE.test(trimmed) ? trimmed.replace(BULLET_PREFIX_RE, "- ") : trimmed;
}

/** True for a line that reads as a list item - used by the PDF/preview renderers. */
export function isBulletLine(line: string): boolean {
  return /^-\s+/.test(line.trim());
}

/** Strips the canonical marker, for renderers that draw their own bullet. */
export function stripBullet(line: string): string {
  return line.trim().replace(/^-\s+/, "");
}

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
      // When the date line ALSO carries the company ("Globex 2016-2020"),
      // only the single line above it is header - reaching back two lines
      // would drag in the previous entry's last description line and file
      // it as this entry's title, which is exactly what happened before.
      const dateLineExtra = clean[d]!.replace(DATE_RE, "").replace(/[\s|,·–—-]+/g, "");
      const lookback = dateLineExtra.length > 3 ? 1 : HEADER_LOOKBACK;
      const headerStart = Math.max(prevDate + 1, d - lookback);
      const nextDate = dateIdx[n + 1];
      // Stop before the next entry's header lines, not at its date line.
      const end = nextDate === undefined ? clean.length : Math.max(d + 1, nextDate - HEADER_LOOKBACK);
      const header = clean.slice(headerStart, d);
      const description = clean.slice(d + 1, end);
      return [...header, clean[d]!, ...description];
    })
    .filter((e) => e.join("").trim().length > 0);
}

/**
 * "Technologies: ...", "Live Product: ...", "Github: ..." - trailing
 * metadata belonging to the entry above. These must never be taken as the
 * NEXT entry's title, which is what happened when the header lookback
 * reached back over them.
 */
function isMetadataLine(line: string): boolean {
  return /^[A-Za-z][A-Za-z &/]{2,24}:\s*\S/.test(line.trim());
}

/** Pulls a trailing date range off a line, returning the remaining text and the date. */
function splitDateFromLine(line: string): { rest: string; date: string | null } {
  const range =
    /((?:[A-Za-z]{3,9}\.?\s*)?(?:\d{1,2}\/)?(?:19|20)\d{2}\s*(?:[-\u2013\u2014]|to)\s*(?:(?:[A-Za-z]{3,9}\.?\s*)?(?:\d{1,2}\/)?(?:19|20)\d{2}|present|current|now))\s*$/i;
  const match = line.match(range);
  if (!match) return { rest: line.trim(), date: null };
  return {
    rest: line.slice(0, match.index).replace(/[\s|,\u00b7\u2013\u2014-]+$/, "").trim(),
    date: match[1]!.trim(),
  };
}

/**
 * Splits "Acme Corp - Senior Engineer" into company and title. Order is
 * genuinely ambiguous across CVs; company-first is the more common
 * convention and is what this assumes, with the user free to swap them in
 * the editor.
 */
function splitCompanyTitle(text: string): { company: string | null; title: string | null } {
  const parts = text.split(/\s+[-\u2013\u2014|]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { company: null, title: null };
  if (parts.length === 1) return { company: null, title: parts[0]! };
  return { company: parts[0]!, title: parts.slice(1).join(" - ") };
}

function toExperience(entry: string[]) {
  const dateAt = entry.findIndex((l) => DATE_RE.test(l));
  const rawHeader = dateAt >= 0 ? entry.slice(0, dateAt) : entry.slice(0, 2);
  const description = dateAt >= 0 ? entry.slice(dateAt + 1) : entry.slice(2);

  // Drop anything that clearly belongs to the previous entry rather than
  // naming this one.
  const header = rawHeader.filter(
    (l) => l.trim() && !isMetadataLine(l) && !isBulletLine(normaliseBulletLine(l))
  );

  let title = stripBullet(header[0]?.trim() ?? "") || null;
  let company = stripBullet(header[1]?.trim() ?? "") || null;
  let dates = dateAt >= 0 ? entry[dateAt]!.trim() : null;

  // The whole header is frequently one line - "Jobr.pro - Software
  // Developer      Jan 2024 - Present" - because the date is
  // right-aligned and extraction puts it on the same line. Peel the date
  // off the end, then split what remains into company and title, rather
  // than storing the entire line as the date.
  if (dates && !title) {
    const { rest, date } = splitDateFromLine(dates);
    if (date) dates = date;
    if (rest) {
      const split = splitCompanyTitle(stripBullet(rest));
      company = split.company;
      title = split.title;
    }
  } else if (title && !company) {
    // "Acme GmbH - Lead Frontend Engineer" on its own line above the date.
    const split = splitCompanyTitle(title);
    if (split.company) {
      company = split.company;
      title = split.title;
    }
  }

  return {
    title,
    company,
    dates,
    description: description.map(normaliseBulletLine).join("\n").trim() || null,
  };
}

function toEducation(entry: string[]) {
  const dateAt = entry.findIndex((l) => DATE_RE.test(l));
  const header = dateAt >= 0 ? entry.slice(0, dateAt) : entry.slice(0, 2);
  return {
    school: stripBullet(normaliseBulletLine(header[0] ?? "")) || null,
    degree: stripBullet(normaliseBulletLine(header[1] ?? "")) || null,
    dates: dateAt >= 0 ? entry[dateAt]!.trim() : null,
  };
}

/**
 * "City, Country" / "City, ST" shaped line in the header block.
 *
 * Deliberately a separate, simpler implementation from ats.ts's own
 * location check rather than a shared helper: this one optimises for
 * filling a good editable draft (lenient, no need to justify a guess),
 * the ATS checker's optimises for defensible evidence about the resume
 * itself - reusing one for the other is exactly the conflation that made
 * the ATS report dishonest, so they stay independent on purpose even
 * though both look for the same shape of line.
 */
function looksLikeLocation(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 60) return false;
  if (EMAIL_RE.test(t) || PHONE_RE.test(t)) return false;
  if (/^https?:|www\.|linkedin\.com|github\.com/i.test(t)) return false;
  const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return false;
  return parts.every((p) => /^[A-Z][A-Za-z.'-]*(\s[A-Z][A-Za-z.'-]*)*$/.test(p));
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

  const location = sections.preamble.map((l) => l.trim()).find(looksLikeLocation) ?? null;

  // Skills lines are usually "Frontend: React.js, Next.js, ..." - the
  // category prefix is a label, not a skill, so it's stripped rather than
  // stored as "Frontend: React.js".
  const skills = sections.skills
    .flatMap((line) => {
      const withoutCategory = line.replace(/^[A-Za-z&/ ]{2,30}:\s*/, "");
      return withoutCategory.split(/[,•|\n]/);
    })
    .map((s) => s.trim().replace(/^[-•●]\s*/, ""))
    .filter((s) => s.length > 1 && s.length < 40)
    .slice(0, 60);

  // An explicit Summary section wins; otherwise fall back to the longest
  // prose line above the first heading, which is where an unlabelled
  // summary paragraph lives on most CVs (this one included).
  const explicitSummary = sections.summary.join(" ").trim();
  const preambleProse = sections.preamble
    .map((l) => l.trim())
    .filter((l) => l.length > 80 && !EMAIL_RE.test(l) && !/^https?:|^www\./i.test(l));
  const summary = explicitSummary || preambleProse.join(" ").trim() || null;

  const additionalSections = sections.other
    .map((group) => ({
      heading: group.heading,
      content: group.lines.map(normaliseBulletLine).join("\n").trim(),
    }))
    .filter((s) => s.content.length > 0);

  return {
    contact: { name, email, phone, location, links },
    summary,
    skills,
    experience: groupEntries(sections.experience).slice(0, 15).map(toExperience),
    education: groupEntries(sections.education).slice(0, 10).map(toEducation),
    projects: groupProjects(sections.projects),
    additionalSections,
  };
}

/**
 * Projects rarely carry date ranges, so the date-anchored grouping used
 * for jobs doesn't apply. A project entry instead starts at a short,
 * non-bullet line (its name) and runs until the next one.
 */
function groupProjects(lines: string[]): ResumeContent["projects"] {
  const clean = lines.map((l) => l.trim()).filter(Boolean);
  const entries: { name: string | null; description: string | null }[] = [];
  let current: string[] = [];

  const flush = () => {
    if (!current.length) return;
    const [name = "", ...rest] = current;
    entries.push({ name: name.trim() || null, description: rest.join("\n").trim() || null });
    current = [];
  };

  let sawBody = false;
  for (const line of clean) {
    const normalised = normaliseBulletLine(line);
    const isBullet = isBulletLine(normalised);
    // "Live Demo: ...", "Github: ...", "Technologies: ..." are metadata
    // belonging to the current project, not the next project's name.
    const isMetadata = /^[A-Za-z][A-Za-z &/]{2,20}:\s*\S/.test(line);
    const looksLikeHeader = line.length < 70 && !isBullet && !isMetadata;

    // A new project only starts once the current one actually has body
    // content. Without this the tech/stack line under a project name
    // ("React Native | Push Notifications") is itself short and
    // non-bulleted, so it was being read as the next project's name.
    if (looksLikeHeader && current.length && sawBody) {
      flush();
      sawBody = false;
    }
    if (isBullet) sawBody = true;
    current.push(normalised);
  }
  flush();
  return entries.slice(0, 12);
}

export const emptyResumeContent = (): ResumeContent => ({
  contact: { name: null, email: null, phone: null, location: null, links: [] },
  summary: null,
  skills: [],
  experience: [],
  education: [],
  projects: [],
  additionalSections: [],
});
