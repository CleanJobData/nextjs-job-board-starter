import * as React from "react";
import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import type { ResumeContent } from "../db/schema";
import { parseMarkdown, parseLinkLine, type MarkdownSegment } from "./markdown";

/**
 * @react-pdf/renderer, not a headless-browser screenshot (Puppeteer/
 * Playwright): it renders directly to PDF primitives with no browser
 * process to boot, which matters for a starter template that has to run
 * on serverless/edge-friendly hosts without assuming a Chromium binary is
 * available. The tradeoff is a small, print-oriented style API (this
 * StyleSheet, not real CSS) - acceptable for a single resume layout.
 *
 * This is the ONE resume layout for now. A real "choose a template" system
 * would mean several of these plus a picker UI - out of scope until the
 * single-layout version is actually used.
 */
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  name: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, color: "#555555", marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
    borderBottom: "1pt solid #dddddd",
    paddingBottom: 3,
  },
  entry: { marginBottom: 8 },
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
  bulletMarker: { width: 10, color: "#333333" },
  bulletText: { flex: 1, color: "#333333", lineHeight: 1.4 },
  descriptionHeading: { fontWeight: 700, color: "#1a1a1a", marginTop: 2, marginBottom: 1 },
  link: { color: "#2563eb", textDecoration: "none" },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillPill: { backgroundColor: "#f2f2f2", borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6 },
});

/** Renders one line's inline segments - plain runs and `[label](url)` links - as siblings inside a parent Text. */
function Segments({ segments }: { segments: MarkdownSegment[] }) {
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
function Description({ text }: { text: string }) {
  const lines = parseMarkdown(text);
  return (
    <View>
      {lines.map((line, i) => {
        if (line.type === "heading") {
          return (
            <Text key={i} style={styles.descriptionHeading}>
              <Segments segments={line.segments} />
            </Text>
          );
        }
        if (line.type === "bullet") {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletMarker}>•</Text>
              <Text style={styles.bulletText}>
                <Segments segments={line.segments} />
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={styles.description}>
            <Segments segments={line.segments} />
          </Text>
        );
      })}
    </View>
  );
}

export function ResumePdfDocument({ content }: { content: ResumeContent }) {
  const { contact, summary, skills, experience, education, projects = [], additionalSections = [] } = content;
  const plainContact = [contact.email, contact.phone, contact.location].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
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

        {summary && (
          <View>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Description text={summary} />
          </View>
        )}

        {experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>{exp.title ?? "Untitled role"}</Text>
                  {exp.dates && <Text style={styles.entryDates}>{exp.dates}</Text>}
                </View>
                {exp.company && <Text style={styles.entrySubtitle}>{exp.company}</Text>}
                {exp.description && <Description text={exp.description} />}
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
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
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((pr, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <Text style={styles.entryTitle}>{pr.name ?? "Untitled project"}</Text>
                {pr.description && <Description text={pr.description} />}
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {skills.map((s, i) => (
                <Text key={i} style={styles.skillPill}>
                  {s}
                </Text>
              ))}
            </View>
          </View>
        )}

        {additionalSections.map((s, i) => (
          <View key={i} wrap={false}>
            <Text style={styles.sectionTitle}>{s.heading}</Text>
            <Description text={s.content} />
          </View>
        ))}
      </Page>
    </Document>
  );
}
