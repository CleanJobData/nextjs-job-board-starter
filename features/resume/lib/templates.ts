/**
 * Split out of pdf.tsx so client components (the editor's template picker)
 * can reference the template list/type without pulling @react-pdf/renderer
 * into the client bundle just for a string union and a label.
 */
export type ResumeTemplate = "classic" | "modern";

export const RESUME_TEMPLATES: { id: ResumeTemplate; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Neutral black text, underlined section headings." },
  { id: "modern", label: "Modern", description: "Accent-coloured headings, no underline." },
];
