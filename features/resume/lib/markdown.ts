/**
 * A small, deliberately minimal markdown subset - headings, bullets, and
 * inline links - shared by the in-app preview (ResumePreview.tsx) and the
 * downloadable PDF (lib/pdf.tsx).
 *
 * Not react-markdown or any other library: @react-pdf/renderer only
 * consumes its own View/Text/Link primitives, not HTML, so the PDF side
 * needs hand-rolled parsing regardless of what the DOM side uses. Splitting
 * the two renderers between a library and hand-rolled code risks them
 * disagreeing on the same text - one small shared parser keeps them
 * identical by construction, the same reason both already render off one
 * ResumeContent shape.
 */

export type MarkdownSegment = { text: string; href?: string };
export type MarkdownLine = { type: "heading" | "bullet" | "text"; segments: MarkdownSegment[] };

const INLINE_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Bare domains ("github.com/x") still need a scheme to be a working link. */
export function normaliseHref(raw: string): string {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function parseInline(text: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_LINK_RE)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ text: text.slice(last, index) });
    segments.push({ text: match[1]!, href: normaliseHref(match[2]!) });
    last = index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments.length > 0 ? segments : [{ text }];
}

/**
 * Splits stored text into lines classified as heading (`# `/`## `/`### `),
 * bullet (`- `/`* ` - a superset of parse.ts's extraction-side `-`-only
 * convention), or plain text, with inline `[label](url)` links parsed out
 * of every line's content.
 */
export function parseMarkdown(text: string): MarkdownLine[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line): MarkdownLine => {
      if (/^#{1,3}\s+/.test(line)) {
        return { type: "heading", segments: parseInline(line.replace(/^#{1,3}\s+/, "")) };
      }
      if (/^[-*]\s+/.test(line)) {
        return { type: "bullet", segments: parseInline(line.replace(/^[-*]\s+/, "")) };
      }
      return { type: "text", segments: parseInline(line) };
    });
}

/** One line of the Links field: "[Label](url)", or a bare url/domain that becomes its own label. */
export function parseLinkLine(raw: string): { label: string; href: string } {
  const match = raw.trim().match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (match) return { label: match[1]!.trim(), href: normaliseHref(match[2]!) };
  const t = raw.trim();
  return { label: t, href: normaliseHref(t) };
}
