/**
 * Split out of pdf.tsx so client components (the editor's template picker)
 * can reference the template list/type without pulling @react-pdf/renderer
 * into the client bundle just for a string union and a label.
 *
 * `atsSafe` is an honest claim, not decoration: Classic, Banner and
 * Executive all stay single-column, top-to-bottom, one standard PDF font -
 * the properties lib/ats.ts's own checks (multi-column, font sprawl) score
 * a resume on - so none of them can trip those checks by construction.
 * Sidebar is a genuine two-column layout: real, common ATS text extractors
 * still read a page as one linear stream and interleave a sidebar with the
 * main column line by line (this is exactly what lib/ats.ts's own
 * "multi-column layout detected" finding warns about on uploaded resumes).
 * It is NOT claimed to be ATS-safe, and the picker UI must say so.
 */
export type ResumeTemplate = "classic" | "banner" | "executive" | "sidebar";

/**
 * Colours for the Banner/Sidebar templates' dark blocks - shared here so
 * lib/pdf.tsx and components/ResumePreview.tsx use the exact same values
 * instead of each hardcoding their own copy (they used to).
 *
 * Deliberately NOT the site's own `--primary`/theme tokens: a resume PDF
 * gets downloaded and sent to employers, so its template colour shouldn't
 * shift just because a job board operator picks a different site preset
 * (see docs/ARCHITECTURE.md's design-tokens section for the site's own
 * token system and why raw colour literals are otherwise avoided).
 */
export const RESUME_TEMPLATE_COLORS = {
  bannerDark: "#1e293b",
  accent: "#0f766e",
} as const;

export const RESUME_TEMPLATES: {
  id: ResumeTemplate;
  label: string;
  description: string;
  atsSafe: boolean;
}[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Sans-serif, left header, underlined section headings, grey skill pills.",
    atsSafe: true,
  },
  {
    id: "banner",
    label: "Banner",
    description: "Full-width dark header banner, name and contact details stacked one per line.",
    atsSafe: true,
  },
  {
    id: "executive",
    label: "Executive",
    description: "Serif, centered all-caps name, plain-text skills line, no colour.",
    atsSafe: true,
  },
  {
    id: "sidebar",
    label: "Sidebar",
    description: "Dark sidebar with contact/skills/education, main column for experience.",
    atsSafe: false,
  },
];
