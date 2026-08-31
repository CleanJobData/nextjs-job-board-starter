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
