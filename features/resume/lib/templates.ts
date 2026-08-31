/**
 * Split out of pdf.tsx so client components (the editor's template picker)
 * can reference the template list/type without pulling @react-pdf/renderer
 * into the client bundle just for a string union and a label.
 *
 * Every template is single-column, top-to-bottom, one standard PDF font
 * family, with no text boxes, tables, or absolute positioning - the exact
 * properties lib/ats.ts's checks (multi-column, header/footer stranding,
 * font sprawl) score a resume on. A template that looked different by
 * rearranging text into columns or graphics would defeat the point of this
 * app's own ATS checker, so structural single-column layout and reading
 * order never vary between templates - typeface, color, header
 * composition, and section/skills treatment do, and vary a lot.
 */
export type ResumeTemplate = "classic" | "modern" | "executive";

export const RESUME_TEMPLATES: { id: ResumeTemplate; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Sans-serif, left header, underlined section headings, grey skill pills." },
  { id: "modern", label: "Modern", description: "Sans-serif, centered header, colour accent bars, outlined skill tags." },
  { id: "executive", label: "Executive", description: "Serif, centered all-caps name, plain-text skills line, no colour." },
];
