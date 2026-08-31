import { getDocumentProxy } from "unpdf";

/** One positioned run of text from the PDF, with everything the layout/ATS analysis needs. */
export type TextItem = {
  str: string;
  /** Left edge, PDF user-space points from the page's left edge. */
  x: number;
  /** Baseline, points from the page BOTTOM (PDF origin is bottom-left, not top-left). */
  y: number;
  width: number;
  height: number;
  fontName: string;
};

export type PageContent = {
  pageNumber: number;
  width: number;
  height: number;
  items: TextItem[];
  /** Whether the page carries image XObjects - used to tell "scanned CV" from "no text at all". */
  hasImages: boolean;
};

export type PdfContent = {
  pages: PageContent[];
  /** Fonts referenced anywhere in the document, for the embedded/standard-font check. */
  fonts: Set<string>;
};

/**
 * Pulls positioned text out of a PDF, rather than the flattened string
 * unpdf's extractText() returns.
 *
 * The coordinates are the whole point: reading order, column detection and
 * most of the ATS checks are geometry questions, and a pre-flattened
 * string has already thrown that geometry away - along with the answer to
 * "why did this CV come out jumbled".
 */
export async function extractPdfContent(buffer: Buffer): Promise<PdfContent> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const pages: PageContent[] = [];
  const fonts = new Set<string>();

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items: TextItem[] = [];
    for (const raw of textContent.items as any[]) {
      if (typeof raw.str !== "string" || !raw.str.trim()) continue;
      const transform = raw.transform ?? [];
      items.push({
        str: raw.str,
        x: transform[4] ?? 0,
        y: transform[5] ?? 0,
        width: raw.width ?? 0,
        height: raw.height ?? 0,
        fontName: raw.fontName ?? "",
      });
      if (raw.fontName) fonts.add(raw.fontName);
    }

    let hasImages = false;
    try {
      const ops = await page.getOperatorList();
      // paintImageXObject / paintInlineImageXObject / paintJpegXObject
      const imageOps = new Set([85, 86, 87]);
      hasImages = ops.fnArray.some((fn: number) => imageOps.has(fn));
    } catch {
      // Operator list is a nice-to-have (it only feeds the scanned-PDF
      // check); a failure here shouldn't sink the whole analysis.
    }

    pages.push({
      pageNumber: n,
      width: viewport.width,
      height: viewport.height,
      items,
      hasImages,
    });
  }

  return { pages, fonts };
}

/** Groups items sitting on roughly the same baseline into one visual line. */
function groupIntoLines(items: TextItem[], tolerance = 3): TextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: TextItem[][] = [];

  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l[0]!.y - item.y) <= tolerance);
    if (line) line.push(item);
    else lines.push([item]);
  }

  return lines.map((l) => l.sort((a, b) => a.x - b.x));
}

function lineToString(line: TextItem[]): string {
  // Insert a space where there's a real horizontal gap, so "React" and
  // "Native" in adjacent runs don't become "ReactNative".
  let out = "";
  for (let i = 0; i < line.length; i++) {
    const item = line[i]!;
    if (i > 0) {
      const prev = line[i - 1]!;
      const gap = item.x - (prev.x + prev.width);
      if (gap > 1) out += " ";
    }
    out += item.str;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** A visual line plus the geometry needed to tell a wrapped line from a finished one. */
type MeasuredLine = { text: string; left: number; right: number };

function measureLine(line: TextItem[]): MeasuredLine {
  return {
    text: lineToString(line),
    left: Math.min(...line.map((i) => i.x)),
    right: Math.max(...line.map((i) => i.x + i.width)),
  };
}

/** Any leading list marker, in the many forms PDF extraction produces. */
const LEADING_MARKER_RE = /^\s*([\u2022\u25AA\u2023\u00B7\u25E6\u25CF\u25CB\u2219*+\u2013\u2014-]|\u2022)\s+/;

/**
 * Rejoins lines that are visually wrapped continuations of the line above.
 *
 * This is the step whose absence produced most of the parser's damage: a
 * bullet running over two physical lines left the second line marker-less
 * and looking, to any text-only heuristic, exactly like a new heading or a
 * new list entry. Every wrapped bullet therefore spawned a phantom entry
 * ("WebSocket connections using Django Channels..." became a project name).
 *
 * Text heuristics can't settle it - continuations routinely begin with a
 * capital ("OpenAPI documentation, and...", "PostgreSQL database and...").
 * Geometry can: a line that runs all the way to the text block's right edge
 * has been broken by the layout engine, not by the author, so the next line
 * continues it. A line ending short of the margin ended deliberately.
 */
function joinWrappedLines(lines: MeasuredLine[]): string[] {
  if (lines.length === 0) return [];

  // The right margin of this block, taken from the widest line rather than
  // the page width - a column or an indented list has its own margin.
  const margin = Math.max(...lines.map((l) => l.right));
  const minLeft = Math.min(...lines.map((l) => l.left));
  const textWidth = Math.max(1, margin - minLeft);
  // Tolerance is a share of the TEXT WIDTH, not of the margin coordinate,
  // and is deliberately generous: an indented block (a bullet's text sits
  // right of its marker) ends short of the paragraph margin by the width
  // of that indent, so a tight tolerance treats every wrapped bullet as a
  // finished line - which is exactly how wrapped bullets were being split
  // into phantom entries. The guards below (a following list marker, or
  // sentence-ending punctuation) prevent this looseness from joining lines
  // that genuinely ended.
  const tolerance = Math.max(12, textWidth * 0.05);
  const reachesMargin = (l: MeasuredLine) => l.right >= margin - tolerance;

  const out: string[] = [];
  let buffer = "";
  let bufferLine: MeasuredLine | null = null;

  const flush = () => {
    if (buffer.trim()) out.push(buffer.trim());
    buffer = "";
    bufferLine = null;
  };

  for (const line of lines) {
    const startsNewItem = LEADING_MARKER_RE.test(line.text);
    const previousWrapped =
      bufferLine !== null &&
      reachesMargin(bufferLine) &&
      // A line finishing a sentence at the margin is a paragraph end, not a
      // mid-sentence break.
      !/[.!?]$/.test(bufferLine.text.trim());

    if (bufferLine && (!previousWrapped || startsNewItem)) flush();

    buffer = buffer ? `${buffer} ${line.text}` : line.text;
    bufferLine = line;
  }
  flush();

  return out;
}

export type ColumnLayout = {
  /** How many content columns were detected on this page. */
  count: number;
  /** X boundaries splitting the columns, ascending. Empty for a single column. */
  boundaries: number[];
};

/**
 * Detects multi-column layout by looking for a vertical corridor with no
 * text in it.
 *
 * Works on the gap rather than on clustering item positions: a CV's
 * sidebar and main body are separated by a band of whitespace that runs
 * most of the page height, and that band is both easy to find and exactly
 * what a naive top-to-bottom extractor fails to respect. Requiring the
 * corridor to be clear for most of the page's vertical extent is what
 * keeps an ordinary two-word line (say a right-aligned date) from being
 * mistaken for a column boundary.
 */
export function detectColumns(page: PageContent, minGapRatio = 0.06): ColumnLayout {
  const items = page.items;
  if (items.length < 15) return { count: 1, boundaries: [] };

  const step = 4;
  const bins = Math.ceil(page.width / step);
  const occupied = new Array<number>(bins).fill(0);

  for (const item of items) {
    const start = Math.max(0, Math.floor(item.x / step));
    const end = Math.min(bins - 1, Math.floor((item.x + item.width) / step));
    for (let b = start; b <= end; b++) occupied[b]! += 1;
  }

  // Only consider corridors in the middle of the page - the outer margins
  // are always empty and are not column boundaries.
  const left = Math.floor(bins * 0.15);
  const right = Math.ceil(bins * 0.85);
  const minGapBins = Math.max(2, Math.floor((page.width * minGapRatio) / step));

  const boundaries: number[] = [];
  let runStart = -1;

  for (let b = left; b <= right; b++) {
    if (occupied[b] === 0) {
      if (runStart === -1) runStart = b;
    } else {
      if (runStart !== -1 && b - runStart >= minGapBins) {
        boundaries.push(((runStart + b) / 2) * step);
      }
      runStart = -1;
    }
  }
  if (runStart !== -1 && right - runStart >= minGapBins) {
    boundaries.push(((runStart + right) / 2) * step);
  }

  // A corridor only counts if both sides actually carry content across a
  // shared vertical band - otherwise it's whitespace, not a column split.
  //
  // The band is measured against the CONTENT's own vertical extent, not the
  // page height: a CV occupying the top third of the sheet is still
  // two-column, and comparing to paper size wrongly rejected exactly that
  // case. Bottom margins vary far too much to be part of the yardstick.
  const allTop = Math.max(...items.map((i) => i.y));
  const allBottom = Math.min(...items.map((i) => i.y));
  const contentHeight = Math.max(1, allTop - allBottom);

  const real = boundaries.filter((boundary) => {
    const leftItems = items.filter((i) => i.x + i.width <= boundary);
    const rightItems = items.filter((i) => i.x >= boundary);
    if (leftItems.length < 5 || rightItems.length < 5) return false;

    const lTop = Math.max(...leftItems.map((i) => i.y));
    const lBottom = Math.min(...leftItems.map((i) => i.y));
    const rTop = Math.max(...rightItems.map((i) => i.y));
    const rBottom = Math.min(...rightItems.map((i) => i.y));
    const overlap = Math.min(lTop, rTop) - Math.max(lBottom, rBottom);
    return overlap > contentHeight * 0.5;
  });

  return { count: real.length + 1, boundaries: real };
}

/**
 * Reading order as a naive parser produces it: content-stream order, which
 * is whatever order the generator happened to emit runs in.
 *
 * This is the "what a basic ATS sees" half of the comparison. It is
 * deliberately NOT corrected - its garbling on a multi-column CV is the
 * finding, not a bug to fix here.
 */
export function extractNaiveText(content: PdfContent): string {
  return content.pages
    .map((page) => page.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim())
    .join("\n\n");
}

/**
 * Reading order reconstructed from geometry: columns left to right, each
 * read top to bottom. This is what a modern layout-aware parser produces,
 * and what the resume parser and any AI call should be fed.
 */
export function extractLayoutAwareText(content: PdfContent): string {
  const pageTexts = content.pages.map((page) => {
    const { boundaries } = detectColumns(page);

    if (boundaries.length === 0) {
      return joinWrappedLines(groupIntoLines(page.items).map(measureLine)).join("\n");
    }

    const edges = [0, ...boundaries, page.width];
    const columns: string[] = [];
    for (let c = 0; c < edges.length - 1; c++) {
      const from = edges[c]!;
      const to = edges[c + 1]!;
      const colItems = page.items.filter((i) => {
        const centre = i.x + i.width / 2;
        return centre >= from && centre < to;
      });
      if (!colItems.length) continue;
      columns.push(joinWrappedLines(groupIntoLines(colItems).map(measureLine)).join("\n"));
    }
    return columns.join("\n\n");
  });

  return pageTexts.join("\n\n");
}
