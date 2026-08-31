import * as React from "react";
import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import type { ResumeContent } from "../db/schema";
import { parseMarkdown, parseLinkLine, type MarkdownSegment } from "./markdown";
import type { ResumeTemplate } from "./templates";

export type { ResumeTemplate } from "./templates";

/**
 * @react-pdf/renderer, not a headless-browser screenshot (Puppeteer/
 * Playwright): it renders directly to PDF primitives with no browser
 * process to boot, which matters for a starter template that has to run
 * on serverless/edge-friendly hosts without assuming a Chromium binary is
 * available. The tradeoff is a small, print-oriented style API (this
 * StyleSheet, not real CSS).
 *
 * Only Helvetica (a built-in PDF standard font, no embedding/registration
 * needed) is used across every template - lib/ats.ts's own font-sprawl and
 * encoding checks exist because non-standard/unembedded fonts are exactly
 * what breaks text extraction, so a "template" system that introduced font
 * variety would be fighting the app's own advice. Templates differ in
 * layout composition and color only. See templates.ts for why the layout
 * itself stays single-column across all of them.
 */
const ACCENT = { modern: "#0f766e" };

type SectionTitleStyle = "underline" | "accent-bar" | "plain-rule";

const TEMPLATE_CONFIG: Record<
  ResumeTemplate,
  { headerAlign: "left" | "center"; sectionTitleStyle: SectionTitleStyle; accent: string }
> = {
  classic: { headerAlign: "left", sectionTitleStyle: "underline", accent: "#1a1a1a" },
  modern: { headerAlign: "center", sectionTitleStyle: "accent-bar", accent: ACCENT.modern },
  minimal: { headerAlign: "left", sectionTitleStyle: "plain-rule", accent: "#1a1a1a" },
};

function buildStyles(template: ResumeTemplate) {
  const cfg = TEMPLATE_CONFIG[template];
  const link = template === "modern" ? cfg.accent : "#2563eb";

  return StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
    header: template === "minimal" ? { marginBottom: 20 } : { marginBottom: 16 },
    name: {
      fontSize: template === "minimal" ? 22 : 20,
      fontWeight: template === "minimal" ? 400 : 700,
      marginBottom: 2,
      color: cfg.accent,
      textAlign: cfg.headerAlign,
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: cfg.headerAlign === "center" ? "center" : "flex-start",
      gap: 8,
      color: "#555555",
    },
    headerRule:
      template === "modern"
        ? { height: 1.5, backgroundColor: cfg.accent, marginTop: 10, opacity: 0.5 }
        : { height: 0 },
    sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 6 },
    sectionTitleBar: { width: 3, height: 10, backgroundColor: cfg.accent },
    sectionTitle: {
      fontSize: template === "minimal" ? 12 : 11,
      fontWeight: 700,
      textTransform: template === "minimal" ? "none" : "uppercase",
      letterSpacing: template === "minimal" ? 0 : 1,
      color: cfg.accent,
    },
    sectionTitleUnderline: { borderBottom: "1pt solid #dddddd", paddingBottom: 3, flex: 1 },
    sectionTitlePlainRule: { borderBottom: "0.5pt solid #eeeeee", paddingBottom: 4, flex: 1 },
    entry: { marginBottom: template === "minimal" ? 12 : 8 },
    entryHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { fontWeight: 700 },
    entryDates: { color: "#666666" },
    entrySubtitle: { color: "#444444", marginBottom: 2 },
    description: { color: "#333333", lineHeight: 1.4 },
    bulletRow: { flexDirection: "row", marginBottom: 2 },
    // A literal "•" depends on the font's encoding carrying U+2022, which is
    // exactly what was mangling bullets on the way in. Drawing the marker as
    // its own Text in a fixed-width column sidesteps the glyph question and
    // gives real hanging indentation, which a "• " prefix inside the text
    // never does (wrapped lines align under the marker, not the text).
    bulletMarker: { width: 10, color: template === "modern" ? cfg.accent : "#333333" },
    bulletText: { flex: 1, color: "#333333", lineHeight: 1.4 },
    descriptionHeading: { fontWeight: 700, color: "#1a1a1a", marginTop: 2, marginBottom: 1 },
    link: { color: link, textDecoration: "none" },
    skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    skillPill:
      template === "modern"
        ? { backgroundColor: "#ecfdf5", color: cfg.accent, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6 }
        : template === "minimal"
          ? { color: "#333333", paddingVertical: 2 }
          : { backgroundColor: "#f2f2f2", borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6 },
  });
}

type Styles = ReturnType<typeof buildStyles>;

/** Renders a section heading per the template's config - underline, accent bar, or a plain thin rule. Always plain top-to-bottom text, never a sidebar or box that would change reading order. */
function SectionTitle({ text, styles, sectionTitleStyle }: { text: string; styles: Styles; sectionTitleStyle: SectionTitleStyle }) {
  if (sectionTitleStyle === "accent-bar") {
    return (
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleBar} />
        <Text style={styles.sectionTitle}>{text}</Text>
      </View>
    );
  }
  const ruleStyle = sectionTitleStyle === "underline" ? styles.sectionTitleUnderline : styles.sectionTitlePlainRule;
  return (
    <View style={[styles.sectionTitleRow, ruleStyle]}>
      <Text style={styles.sectionTitle}>{text}</Text>
    </View>
  );
}

/** Renders one line's inline segments - plain runs and `[label](url)` links - as siblings inside a parent Text. */
function Segments({ segments, styles }: { segments: MarkdownSegment[]; styles: Styles }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.href ? (
          <Link key={i} src={seg.href} style={styles.link}>
            {seg.text}
          </Link>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </>
  );
}

/** Renders a stored description through lib/markdown.ts's shared parser - see that file for why this isn't a library. Mirrors ResumePreview.tsx's Description. */
function Description({ text, styles }: { text: string; styles: Styles }) {
  const lines = parseMarkdown(text);
  return (
    <View>
      {lines.map((line, i) => {
        if (line.type === "heading") {
          return (
            <Text key={i} style={styles.descriptionHeading}>
              <Segments segments={line.segments} styles={styles} />
            </Text>
          );
        }
        if (line.type === "bullet") {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletMarker}>•</Text>
              <Text style={styles.bulletText}>
                <Segments segments={line.segments} styles={styles} />
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={styles.description}>
            <Segments segments={line.segments} styles={styles} />
          </Text>
        );
      })}
    </View>
  );
}

export function ResumePdfDocument({
  content,
  template = "classic",
}: {
  content: ResumeContent;
  template?: ResumeTemplate;
}) {
  const cfg = TEMPLATE_CONFIG[template];
  const styles = buildStyles(template);
  const { contact, summary, skills, experience, education, projects = [], additionalSections = [] } = content;
  const plainContact = [contact.email, contact.phone, contact.location].filter(Boolean) as string[];
  const title = (text: string) => (
    <SectionTitle text={text} styles={styles} sectionTitleStyle={cfg.sectionTitleStyle} />
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          {contact.name && <Text style={styles.name}>{contact.name}</Text>}
          {(plainContact.length > 0 || contact.links.length > 0) && (
            <View style={styles.contactRow}>
              {plainContact.map((c, i) => (
                <Text key={`c-${i}`}>{c}</Text>
              ))}
              {contact.links.map((l, i) => {
                const { label, href } = parseLinkLine(l);
                return (
                  <Link key={`l-${i}`} src={href} style={styles.link}>
                    {label}
                  </Link>
                );
              })}
            </View>
          )}
          {template === "modern" && <View style={styles.headerRule} />}
        </View>

        {summary && (
          <View>
            {title("Summary")}
            <Description text={summary} styles={styles} />
          </View>
        )}

        {experience.length > 0 && (
          <View>
            {title("Experience")}
            {experience.map((exp, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>{exp.title ?? "Untitled role"}</Text>
                  {exp.dates && <Text style={styles.entryDates}>{exp.dates}</Text>}
                </View>
                {exp.company && <Text style={styles.entrySubtitle}>{exp.company}</Text>}
                {exp.description && <Description text={exp.description} styles={styles} />}
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View>
            {title("Education")}
            {education.map((ed, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>{ed.school ?? "Untitled school"}</Text>
                  {ed.dates && <Text style={styles.entryDates}>{ed.dates}</Text>}
                </View>
                {ed.degree && <Text style={styles.entrySubtitle}>{ed.degree}</Text>}
              </View>
            ))}
          </View>
        )}

        {projects.length > 0 && (
          <View>
            {title("Projects")}
            {projects.map((pr, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <Text style={styles.entryTitle}>{pr.name ?? "Untitled project"}</Text>
                {pr.description && <Description text={pr.description} styles={styles} />}
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View>
            {title("Skills")}
            <View style={styles.skillsRow}>
              {skills.map((s, i) => (
                <Text key={i} style={styles.skillPill}>
                  {template === "minimal" && i < skills.length - 1 ? `${s} ·` : s}
                </Text>
              ))}
            </View>
          </View>
        )}

        {additionalSections.map((s, i) => (
          <View key={i} wrap={false}>
            {title(s.heading)}
            <Description text={s.content} styles={styles} />
          </View>
        ))}
      </Page>
    </Document>
  );
}
