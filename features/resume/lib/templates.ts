/**
 * Split out of pdf.tsx so client components (the editor's template picker)
 * can reference the template list/type without pulling @react-pdf/renderer
 * into the client bundle just for a string union and a label.
 *
 * Every template is single-column, top-to-bottom, standard-font, with no
 * text boxes, tables, or absolute positioning - the exact properties
 * lib/ats.ts's checks (multi-column, header/footer stranding, font sprawl)
 * score a resume on. A template that looked different by rearranging text
 * into columns or graphics would defeat the point of this app's own ATS
 * checker, so structural layout doesn't vary between templates - only
 * typography, color, and section-heading treatment do.
 */
export type ResumeTemplate = "classic" | "modern" | "minimal";

export const RESUME_TEMPLATES: { id: ResumeTemplate; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Left-aligned header, underlined section headings." },
  { id: "modern", label: "Modern", description: "Centered header, accent-bar section headings." },
  { id: "minimal", label: "Minimal", description: "No borders or color, generous whitespace." },
];
