import {
  detectColumns,
  extractLayoutAwareText,
  extractNaiveText,
  type PdfContent,
} from "./extract";

export type AtsSeverity = "critical" | "warning" | "info";

export type AtsFinding = {
  id: string;
  severity: AtsSeverity;
  /** Short statement of the problem. */
  title: string;
  /** Why an ATS specifically cares - the "what does this mean" the user asked for. */
  impact: string;
  /** Concrete remedy, not generic advice. */
  fix: string;
  /**
   * The actual text/values the check fired on. Without this a finding is
   * just an assertion the user can't verify - "content sits in the footer"
   * is unactionable until you can see WHICH content.
   */
  evidence?: string[];
};

/**
 * One field an ATS would try to populate from the CV, and whether it could
 * actually be recovered from this file.
 *
 * This is the honest core of the report. We cannot promise we understood a
 * CV correctly - no parser can, since a PDF carries no semantics - so
 * instead of asserting a verdict we show what a machine actually got and
 * let the person confirm it. A field we could not recover is one a real
 * ATS is unlikely to recover either, and a field we recovered WRONGLY is
 * something only the candidate can spot.
 */
export type AtsRecoveredField = {
  label: string;
  value: string | null;
  /** False when nothing usable came out - rendered as a gap to fix, not a silent blank. */
  ok: boolean;
  /** Why this field matters to a screening system. */
  note: string;
  /** The raw line(s) this verdict was based on, so the user can check our work instead of trusting a bare pass/fail. */
  evidence?: string[];
};

export type AtsReport = {
  /** 0-100. See SEVERITY_PENALTY for how findings reduce it. */
  score: number;
  findings: AtsFinding[];
  /** Checks that passed, so the report shows what's already right rather than only problems. */
  passed: string[];
  /** Side-by-side of naive vs layout-aware extraction - the "what a basic ATS sees" comparison. */
  naiveText: string;
  layoutAwareText: string;
  /** What a machine could actually pull out - see AtsRecoveredField. */
  recovered: AtsRecoveredField[];
  /**
   * 0-1 disagreement between the naive and layout-aware readings of the
   * same file. High disagreement means reading order is ambiguous, so
   * different systems will store different things - a risk that can be
   * measured without knowing which reading is "correct".
   */
  divergence: number;
  stats: {
    pages: number;
    characters: number;
    columns: number;
    fonts: number;
  };
};

/**
 * How much two readings of the same document disagree, by comparing
 * adjacent-word pairs rather than raw text: both readings contain the same
 * words, so only their ORDER can differ, and bigrams capture order.
 */
function orderDivergence(a: string, b: string): number {
  const bigrams = (text: string) => {
    const words = text.toLowerCase().match(/[a-z0-9@.+-]+/g) ?? [];
    const out = new Set<string>();
    for (let i = 0; i < words.length - 1; i++) out.add(`${words[i]} ${words[i + 1]}`);
    return out;
  };
  const first = bigrams(a);
  const second = bigrams(b);
  if (first.size === 0 || second.size === 0) return 0;
  let shared = 0;
  for (const pair of first) if (second.has(pair)) shared++;
  return 1 - shared / Math.max(first.size, second.size);
}

/**
 * A critical finding is something that can lose the application outright
 * (an unreadable file, no contact details). A warning degrades parsing
 * quality. Info is worth knowing but rarely decisive - so it doesn't move
 * the score much.
 */
const SEVERITY_PENALTY: Record<AtsSeverity, number> = {
  critical: 35,
  warning: 12,
  info: 4,
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;

/** Headings an ATS looks for when bucketing a CV into sections. */
const EXPECTED_SECTIONS: { label: string; re: RegExp }[] = [
  // Plural-tolerant, same reason as the parser's patterns: a real CV
  // heading is "Work Experiences", and `experience\b` does not match it -
  // which had this check reporting a missing Experience section on a CV
  // that clearly had one.
  {
    label: "Experience",
    re: /^(work\s+)?(experiences?|employment( history)?|professional experiences?|careers?|work histor(y|ies)|positions?)\b/im,
  },
  { label: "Education", re: /^(education(al)?|academics?|academic background|qualifications?|degrees?)\b/im },
  {
    label: "Skills",
    re: /^(skills?|technical skills?|core skills?|technolog(y|ies)|tech stack|competenc(y|ies)|expertise)\b/im,
  },
];

const URL_LINE_RE = /^https?:|www\.|linkedin\.com|github\.com/i;

/**
 * Field-recovery checks below are deliberately independent of the resume
 * builder's parser (lib/parse.ts): that parser exists to fill a good
 * editable draft and is allowed to guess leniently since a human corrects
 * it, while these exist to make a defensible claim about how the resume
 * itself is structured. Reusing the builder's parser here would mean every
 * gap reported is really a report card on our implementation, not
 * evidence about the file - so each check below is small, self-contained,
 * and returns the raw line(s) it based its answer on.
 */

/** Index of the first line matching one of EXPECTED_SECTIONS, or the line count if none is found. */
function firstHeadingIndex(lines: string[]): number {
  const idxs = EXPECTED_SECTIONS.map((s) =>
    lines.findIndex((l) => l.trim().length < 60 && s.re.test(l.trim()))
  ).filter((i) => i !== -1);
  return idxs.length ? Math.min(...idxs) : lines.length;
}

/** The lines between one EXPECTED_SECTIONS heading and the next recognised one (or end of doc). */
function sectionBody(lines: string[], label: string): string[] {
  const pattern = EXPECTED_SECTIONS.find((s) => s.label === label)!.re;
  const start = lines.findIndex((l) => l.trim().length < 60 && pattern.test(l.trim()));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const nextOffset = rest.findIndex(
    (l) =>
      l.trim().length < 60 &&
      EXPECTED_SECTIONS.some((s) => s.label !== label && s.re.test(l.trim()))
  );
  return nextOffset === -1 ? rest : rest.slice(0, nextOffset);
}

function findName(headerLines: string[]): { value: string | null; evidence: string[] } {
  for (const raw of headerLines) {
    const t = raw.trim();
    if (!t || t.length > 60) continue;
    if (EMAIL_RE.test(t) || PHONE_RE.test(t) || URL_LINE_RE.test(t)) continue;
    if (/[a-z]/i.test(t)) return { value: t, evidence: [t] };
  }
  return { value: null, evidence: ["No plain-text line in the header block looked like a name."] };
}

/**
 * "City, Region" shaped line in the header block. A separate, simpler
 * implementation from parse.ts's own location heuristic on purpose - see
 * the comment above this section.
 */
function findLocation(headerLines: string[]): { value: string | null; evidence: string[] } {
  for (const raw of headerLines) {
    const t = raw.trim();
    if (!t || EMAIL_RE.test(t) || PHONE_RE.test(t) || URL_LINE_RE.test(t)) continue;
    const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2 || parts.length > 3) continue;
    if (parts.every((p) => /^[A-Z][A-Za-z.'-]*(\s[A-Z][A-Za-z.'-]*)*$/.test(p))) {
      return { value: t, evidence: [t] };
    }
  }
  const excerpt = headerLines.map((l) => l.trim()).filter(Boolean);
  return {
    value: null,
    evidence: excerpt.length
      ? [`Header block found, but no "City, Region" shaped line in it: ${excerpt.join(" | ")}`]
      : ["No header block found above the first section heading."],
  };
}

const DATE_RANGE_TAIL_RE =
  /((?:[A-Za-z]{3,9}\.?\s*)?(?:\d{1,2}\/)?(?:19|20)\d{2}\s*(?:[-–—]|to)\s*(?:(?:[A-Za-z]{3,9}\.?\s*)?(?:\d{1,2}\/)?(?:19|20)\d{2}|present|current|now))\s*$/i;

/** Splits "Acme Corp - Senior Engineer" into company and title; company-first, same convention as most CVs use. */
function splitCompanyTitle(line: string): { company: string | null; title: string | null } {
  const withoutDate = line.replace(DATE_RANGE_TAIL_RE, "").replace(/[\s|,·–—-]+$/, "").trim();
  const source = withoutDate || line.trim();
  const parts = source.split(/\s+[-–—|]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { company: parts[0]!, title: parts.slice(1).join(" - ") };
  return { company: null, title: source || null };
}

/**
 * Most recent title/employer and a role count, anchored on the first dated
 * line in the Experience section - the same convention any date-anchored
 * parser relies on, but without parse.ts's lookback tuning or metadata
 * filtering: this only needs the first entry, not a clean full history.
 */
function findExperience(lines: string[]): {
  title: string | null;
  employer: string | null;
  roles: number;
  evidence: string[];
} {
  const body = sectionBody(lines, "Experience").map((l) => l.trim()).filter(Boolean);
  if (body.length === 0) {
    return { title: null, employer: null, roles: 0, evidence: ["No Experience section found."] };
  }
  const dateIdxs = body.map((l, i) => (/\b(19|20)\d{2}\b/.test(l) ? i : -1)).filter((i) => i >= 0);
  if (dateIdxs.length === 0) {
    return { title: null, employer: null, roles: 0, evidence: ["Experience section found, but no dated line within it."] };
  }
  const first = dateIdxs[0]!;
  const headerLines = body.slice(Math.max(0, first - 2), first);
  let company: string | null;
  let title: string | null;
  if (headerLines.length > 0) {
    const split = splitCompanyTitle(headerLines[headerLines.length - 1]!);
    title = split.title;
    company = headerLines.length > 1 ? headerLines[headerLines.length - 2]! : split.company;
  } else {
    const split = splitCompanyTitle(body[first]!);
    company = split.company;
    title = split.title;
  }
  return { title, employer: company, roles: dateIdxs.length, evidence: [...headerLines, body[first]!] };
}

function findEducation(lines: string[]): { school: string | null; evidence: string[] } {
  const body = sectionBody(lines, "Education").map((l) => l.trim()).filter(Boolean);
  if (body.length === 0) return { school: null, evidence: ["No Education section found."] };
  const school = body[0]!.replace(/^[-•▪]\s*/, "");
  return { school, evidence: [body[0]!] };
}

function findSkills(lines: string[]): { count: number; evidence: string[] } {
  const body = sectionBody(lines, "Skills").map((l) => l.trim()).filter(Boolean);
  if (body.length === 0) return { count: 0, evidence: ["No Skills section found."] };
  const tokens = body
    .flatMap((line) => line.replace(/^[A-Za-z&/ ]{2,30}:\s*/, "").split(/[,•|]/))
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40);
  return { count: tokens.length, evidence: body.slice(0, 4) };
}

/**
 * Mojibake left behind when a PDF's font encoding doesn't survive text
 * extraction. Replacement characters and stray control codes are the
 * reliable tell; a bullet coming out as a quote is the same failure and is
 * caught by the ratio check below rather than by listing every variant.
 */
const MOJIBAKE_RE = /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

/**
 * Analyses a CV the way an applicant tracking system would, and explains
 * every finding in terms of what the ATS does with it.
 *
 * All checks are deterministic properties of the PDF - geometry, fonts,
 * encoding, presence of text - rather than judgements about the writing.
 * That's deliberate: these are the failures that silently lose an
 * application before a human ever reads it, and unlike content advice they
 * can be verified rather than guessed at.
 */
export function analyseAts(content: PdfContent): AtsReport {
  const findings: AtsFinding[] = [];
  const passed: string[] = [];

  const naiveText = extractNaiveText(content);
  const layoutAwareText = extractLayoutAwareText(content);
  const totalChars = layoutAwareText.replace(/\s/g, "").length;
  const maxColumns = Math.max(1, ...content.pages.map((p) => detectColumns(p).count));
  const hasImages = content.pages.some((p) => p.hasImages);

  // --- Is there machine-readable text at all? -------------------------
  if (totalChars < 100) {
    findings.push({
      id: "no-text",
      severity: "critical",
      title: hasImages
        ? "This looks like a scanned or image-based CV"
        : "Almost no readable text could be extracted",
      impact:
        "An ATS reads the text layer of a PDF, not the picture. With no extractable text there is nothing to index, so the application is usually discarded before anyone sees it - a human never gets the chance to look at the design.",
      fix: hasImages
        ? "Export the CV directly from your word processor as a PDF instead of scanning it or exporting it as an image. If you only have a scan, re-type it or run OCR and rebuild the document."
        : "Re-export the PDF from the original document with text selectable. If you cannot select the text in a PDF viewer, neither can an ATS.",
    });
  } else {
    passed.push("The CV has a readable text layer");
  }

  // --- Multi-column layout --------------------------------------------
  if (maxColumns > 1) {
    findings.push({
      id: "multi-column",
      severity: "critical",
      title: `Multi-column layout detected (${maxColumns} columns)`,
      impact:
        "Many ATS read a page as one straight run of text rather than following the visual columns. A sidebar next to a main body gets interleaved line by line, so a skill from the sidebar lands in the middle of a job description and your actual experience becomes unreadable. See the comparison below - the left panel is what a basic parser produces from this exact file.",
      fix:
        "Use a single-column layout for the whole document. Keep skills, languages and profile links in their own full-width sections stacked vertically rather than in a sidebar. This is the single highest-impact change for machine readability.",
    });
  } else {
    passed.push("Single-column layout, which parses in the correct reading order");
  }

  // --- Contact details -------------------------------------------------
  const emailMatch = layoutAwareText.match(EMAIL_RE)?.[0] ?? null;
  const phoneMatch = layoutAwareText.match(PHONE_RE)?.[0]?.trim() ?? null;
  const hasEmail = Boolean(emailMatch);
  const hasPhone = Boolean(phoneMatch);
  if (!hasEmail || !hasPhone) {
    const missing = [!hasEmail && "email address", !hasPhone && "phone number"].filter(Boolean);
    findings.push({
      id: "missing-contact",
      severity: hasEmail || hasPhone ? "warning" : "critical",
      title: `No ${missing.join(" or ")} found in the text`,
      impact:
        "Contact details are the fields an ATS most reliably tries to auto-fill. If they are not in the text layer - commonly because they sit in a header, a text box, or an image - your record can be created with no way to reach you.",
      fix:
        "Put your email and phone as ordinary text in the body of the first page, not in the page header/footer and not inside a graphic.",
    });
  } else {
    passed.push("Email and phone number are present as machine-readable text");
  }

  // --- Text stranded in headers/footers ---------------------------------
  // A real running header/footer is boilerplate REPEATED across pages -
  // a name, a page number. Body text simply continuing at the top of page
  // 2 is not a header, and flagging it produced obvious false positives
  // ("Architected a modular Chrome extension" reported as header content).
  // So: only margin text that actually recurs on multiple pages counts.
  const marginItems = content.pages.flatMap((page) =>
    page.items
      .filter((i) => i.y > page.height * 0.94 || i.y < page.height * 0.06)
      .map((i) => ({ ...i, page: page.pageNumber, isHeader: i.y > page.height * 0.5 }))
  );
  const pagesByText = new Map<string, Set<number>>();
  for (const item of marginItems) {
    const key = item.str.trim();
    if (!key) continue;
    if (!pagesByText.has(key)) pagesByText.set(key, new Set());
    pagesByText.get(key)!.add(item.page);
  }
  const headerFooterItems = marginItems.filter(
    (i) => (pagesByText.get(i.str.trim())?.size ?? 0) > 1 || /^\s*(page\s*)?\d+\s*(of\s*\d+)?\s*$/i.test(i.str)
  );
  if (headerFooterItems.length > 3) {
    findings.push({
      id: "header-footer-text",
      severity: "warning",
      title: "Content sits in the page header or footer area",
      impact:
        "Some parsers strip the header and footer region before reading a document, on the assumption it holds page numbers and boilerplate. Anything you put there - often contact details or a name - can vanish entirely.",
      fix: "Move anything meaningful out of the header/footer and into the main body of the page.",
      evidence: headerFooterItems
        .slice(0, 12)
        .map((i) => `p${i.page} ${i.isHeader ? "header" : "footer"}: "${i.str.trim()}"`),
    });
  } else {
    passed.push("No important content stranded in header/footer regions");
  }

  // --- Expected sections -----------------------------------------------
  const missingSections = EXPECTED_SECTIONS.filter((s) => !s.re.test(layoutAwareText)).map(
    (s) => s.label
  );
  // Short, heading-ish lines, so the report can show what it DID see - a
  // "no Experience heading" finding is impossible to trust or act on
  // without knowing which headings were actually detected.
  const detectedHeadings = layoutAwareText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 40 && !/[.,;]$/.test(l))
    .filter((l) => l === l.toUpperCase() || /^[A-Z][a-z]+( [A-Z][a-z]+){0,2}$/.test(l))
    .slice(0, 20);
  if (missingSections.length > 0) {
    findings.push({
      id: "missing-sections",
      severity: "warning",
      title: `No clear ${missingSections.join(" / ")} heading`,
      impact:
        "An ATS buckets your CV by looking for conventional section headings. Creative titles like 'Where I've Made an Impact' are not recognised, so that content may be filed as uncategorised text and miss keyword matching for the role.",
      fix: `Use plain, conventional headings - ${missingSections
        .map((m) => `"${m}"`)
        .join(", ")} - on their own line. You can keep a more expressive design elsewhere.`,
      evidence: detectedHeadings.length
        ? [`Heading-like lines detected: ${detectedHeadings.join(" | ")}`]
        : ["No heading-like lines were detected at all."],
    });
  } else {
    passed.push("Standard section headings (Experience, Education, Skills) were found");
  }

  // --- Encoding damage --------------------------------------------------
  const mojibakeHits = layoutAwareText.split("\n").filter((l) => MOJIBAKE_RE.test(l)).length;
  if (mojibakeHits > 0) {
    findings.push({
      id: "encoding-damage",
      severity: "warning",
      title: "Some characters did not extract cleanly",
      impact:
        "The font's character mapping is not fully embedded, so extracted text contains replacement characters. Words touched by this are indexed as gibberish and will not match a search.",
      fix:
        "Re-export the PDF with fonts fully embedded, or switch to a common font (Arial, Calibri, Times New Roman, Helvetica) before exporting.",
    });
  } else {
    passed.push("Characters extracted cleanly, with no encoding damage");
  }

  // --- Length -----------------------------------------------------------
  if (content.pages.length > 3) {
    findings.push({
      id: "too-long",
      severity: "info",
      title: `${content.pages.length} pages`,
      impact:
        "Length does not usually break parsing, but most screeners expect one to two pages and reviewers rarely read past the second.",
      fix: "Trim to the most relevant one or two pages for the role you are applying to.",
    });
  } else {
    passed.push(`Reasonable length (${content.pages.length} page${content.pages.length === 1 ? "" : "s"})`);
  }

  // --- Font sprawl ------------------------------------------------------
  if (content.fonts.size > 6) {
    findings.push({
      id: "many-fonts",
      severity: "info",
      title: `${content.fonts.size} distinct fonts used`,
      impact:
        "Each additional font is another chance for an embedding or encoding problem, and heavy font mixing often indicates text boxes or imported graphics that parse poorly.",
      fix: "Reduce to one or two font families with weight changes for emphasis.",
    });
  } else {
    passed.push("A restrained set of fonts, which embeds and extracts reliably");
  }

  // --- What a standard-convention parser could find ---------------------
  // Independent of the resume builder's parser - see the comment above
  // findName() for why. Each check works directly off layoutAwareText and
  // returns the line(s) it based its answer on, so the table below can
  // show evidence rather than a bare verdict.
  const lines = layoutAwareText.split("\n");
  const headerLines = lines.slice(0, firstHeadingIndex(lines));
  const name = findName(headerLines);
  const location = findLocation(headerLines);
  const experience = findExperience(lines);
  const education = findEducation(lines);
  const skills = findSkills(lines);

  const recovered: AtsRecoveredField[] = [
    { label: "Name", value: name.value, ok: Boolean(name.value), note: "Used to create your candidate record.", evidence: name.evidence },
    { label: "Email", value: emailMatch, ok: hasEmail, note: "The primary way a recruiter contacts you.", evidence: emailMatch ? [emailMatch] : ["No email-shaped text found in the document."] },
    { label: "Phone", value: phoneMatch, ok: hasPhone, note: "Often a required field on the application form.", evidence: phoneMatch ? [phoneMatch] : ["No phone-shaped text found in the document."] },
    { label: "Location", value: location.value, ok: Boolean(location.value), note: "Used to filter by region or right-to-work.", evidence: location.evidence },
    {
      label: "Most recent title",
      value: experience.title,
      ok: Boolean(experience.title),
      note: "Frequently matched against the role you applied for.",
      evidence: experience.evidence,
    },
    {
      label: "Most recent employer",
      value: experience.employer,
      ok: Boolean(experience.employer),
      note: "Builds your employment history record.",
      evidence: experience.evidence,
    },
    {
      label: "Roles detected",
      value: experience.roles > 0 ? `${experience.roles} role(s)` : null,
      ok: experience.roles > 0,
      note: "Your work history timeline. Zero here means your experience may not be indexed at all.",
      evidence: experience.evidence,
    },
    {
      label: "Education",
      value: education.school,
      ok: Boolean(education.school),
      note: "Screened on for degree requirements.",
      evidence: education.evidence,
    },
    {
      label: "Skills",
      value: skills.count > 0 ? `${skills.count} detected` : null,
      ok: skills.count > 0,
      note: "Keyword matching runs against these.",
      evidence: skills.evidence,
    },
  ];

  const unrecovered = recovered.filter((f) => !f.ok);
  if (unrecovered.length > 0) {
    findings.push({
      id: "unrecovered-fields",
      severity: unrecovered.some((f) => ["Name", "Email", "Roles detected"].includes(f.label))
        ? "critical"
        : "warning",
      title: `${unrecovered.length} field${unrecovered.length === 1 ? "" : "s"} could not be read from your CV`,
      impact:
        "These are fields most automated parsers look for in a standard place - not what one specific ATS does, but the convention a well-built one relies on. A gap here is about how the information is presented in your resume, and a blank field can quietly exclude you from filtered searches.",
      fix: "Check the evidence below for each field. Where a field is missing, make sure it appears as plain, conventionally-placed text - near the top for contact details, directly above the date for a job title - rather than inside a header, a text box, a table or an image.",
      evidence: unrecovered.map((f) => `${f.label}: not found`),
    });
  } else {
    passed.push("Every core field (name, contact, roles, education) was presented in a standard, machine-readable way");
  }

  // --- Content quality --------------------------------------------------
  // Structural checks only cover whether a machine can READ the CV. These
  // cover whether what it reads is worth anything - the user's point that
  // our own parser may already be better than a given ATS, so structural
  // passes alone shouldn't imply a strong CV.
  const bodyLines = layoutAwareText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Dates: judged against how many roles were actually detected, not a flat
  // threshold - a CV with one job and one dated role is complete, and
  // demanding two dated lines flagged it as a problem when it wasn't.
  const dateCount = bodyLines.filter((l) => /\b(19|20)\d{2}\b/.test(l)).length;
  const roleCount = experience.roles;
  const datesLookIncomplete = roleCount === 0 ? dateCount === 0 : dateCount < roleCount;
  if (datesLookIncomplete) {
    findings.push({
      id: "few-dates",
      severity: "warning",
      title: "Very few dates found",
      impact:
        "An ATS reconstructs your employment timeline from date ranges, and recruiters filter on years of experience. With no parseable dates your history can't be ordered, and you may be excluded from searches that filter by recency or tenure.",
      fix: "Give every role and qualification an explicit date range, e.g. \"Mar 2021 - Present\". Spell out years in full rather than using \"'21\".",
      evidence: [`${dateCount} dated line(s) for ${roleCount} detected role(s).`],
    });
  } else {
    passed.push("Dates are present and parseable");
  }

  // Quantified achievements - the single most common CV-writing gap.
  const bulletLines = bodyLines.filter((l) => /^[-\u2022\u25AA\u25CF]/.test(l));
  const quantified = bodyLines.filter((l) =>
    /\d[\d,.]*\s*(%|percent|\+|x\b|k\b|m\b|users|customers|hours|days|people|engineers)/i.test(l)
  );
  // Proportional, not absolute: "fewer than two metrics" wrongly flagged a
  // short CV whose every bullet was quantified. The real signal is what
  // share of the achievements carry a number.
  const quantifiedShare = bulletLines.length ? quantified.length / bulletLines.length : 1;
  if (bulletLines.length >= 3 && quantifiedShare < 0.3) {
    findings.push({
      id: "few-metrics",
      severity: "info",
      title: "Little quantified impact",
      impact:
        "Bullets describing responsibilities read as generic to both keyword matching and a human reviewer. Numbers are what distinguish \"maintained the pipeline\" from \"cut pipeline runtime 40%\".",
      fix: "Add a measurable outcome to your strongest bullets - percentages, volumes, time saved, revenue, team size.",
      evidence: [
        `${quantified.length} of ${bulletLines.length} achievement lines contain a number.`,
      ],
    });
  } else if (quantified.length > 0) {
    passed.push("Achievements include quantified results");
  }

  // Overlong bullets - hurts human review more than machine parsing.
  const longLines = bodyLines.filter((l) => l.length > 220);
  if (longLines.length > 0) {
    findings.push({
      id: "long-bullets",
      severity: "info",
      title: `${longLines.length} very long line${longLines.length === 1 ? "" : "s"}`,
      impact:
        "Dense paragraphs are skimmed past. Keyword matching still works, but a human reviewer spending seconds per CV is unlikely to extract your strongest points from a block of text.",
      fix: "Break long paragraphs into separate bullets of roughly one or two lines each.",
      evidence: longLines.slice(0, 3).map((l) => `"${l.slice(0, 120)}..."`),
    });
  } else {
    passed.push("Bullet lengths are readable");
  }

  // --- Reading-order stability -----------------------------------------
  const divergence = orderDivergence(naiveText, layoutAwareText);
  if (divergence > 0.25) {
    findings.push({
      id: "reading-order-unstable",
      severity: divergence > 0.5 ? "critical" : "warning",
      title: `Reading order is ambiguous (${Math.round(divergence * 100)}% disagreement between parsers)`,
      impact:
        "Two different parsers read this file in measurably different orders. That means two employers using different systems will store DIFFERENT versions of your CV, and at least one of them will be scrambled. This is measured by comparing the two readings, so it holds regardless of which one is 'right'.",
      fix:
        "Lay the document out as a single top-to-bottom column, avoid text boxes and tables, and keep each section as one continuous block so there is only one sensible order to read it in.",
      evidence: [`Naive reading and layout-aware reading share only ${Math.round((1 - divergence) * 100)}% of their word ordering.`],
    });
  } else {
    passed.push("Both parsers read the document in the same order");
  }

  const penalty = findings.reduce((total, f) => total + SEVERITY_PENALTY[f.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    findings,
    passed,
    naiveText,
    layoutAwareText,
    recovered,
    divergence,
    stats: {
      pages: content.pages.length,
      characters: totalChars,
      columns: maxColumns,
      fonts: content.fonts.size,
    },
  };
}
