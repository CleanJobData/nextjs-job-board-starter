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
 * Only the PDF "standard 14" fonts are used (Helvetica, Times-Roman) - no
 * registration/embedding needed, and both extract text identically well.
 *
 * "sidebar" is rendered by a completely separate component
 * (SidebarDocument) rather than folded into the shared config below - see
 * templates.ts's doc comment on `atsSafe` for why it's structurally
 * different (real two columns) rather than a style variant of the other
 * three (always one column).
 */
const BANNER_DARK = "#1e293b";
const ACCENT = "#0f766e";

type SkillsStyle = "pill-filled" | "pill-outline" | "plain-list";
type SectionTitleStyle = "underline" | "accent-bar" | "centered-rule";

const TEMPLATE_CONFIG: Record<
  "classic" | "banner" | "executive",
  {
    fontFamily: "Helvetica" | "Times-Roman";
    headerAlign: "left" | "center";
    nameUppercase: boolean;
    sectionTitleStyle: SectionTitleStyle;
    skillsStyle: SkillsStyle;
    accent: string;
  }
> = {
  classic: {
    fontFamily: "Helvetica",
    headerAlign: "left",
    nameUppercase: false,
    sectionTitleStyle: "underline",
    skillsStyle: "pill-filled",
    accent: "#1a1a1a",
  },
  banner: {
    fontFamily: "Helvetica",
    headerAlign: "left",
    nameUppercase: false,
    sectionTitleStyle: "accent-bar",
    skillsStyle: "pill-outline",
    accent: ACCENT,
  },
  executive: {
    fontFamily: "Times-Roman",
    headerAlign: "center",
    nameUppercase: true,
    sectionTitleStyle: "centered-rule",
    skillsStyle: "plain-list",
    accent: "#1a1a1a",
  },
};

function buildStyles(template: "classic" | "banner" | "executive") {
  const cfg = TEMPLATE_CONFIG[template];
  const link = template === "banner" ? cfg.accent : template === "executive" ? "#1a1a1a" : "#2563eb";
  const bold = 700 as const;

  return StyleSheet.create({
    page: { padding: 0, fontSize: 10, fontFamily: cfg.fontFamily, color: "#1a1a1a" },
    body: {
      paddingHorizontal: 40,
      paddingBottom: 40,
      paddingTop: template === "banner" ? 20 : 40,
    },
    // Banner-only: a full-bleed dark rectangle behind the name/contact
    // block. Still plain top-to-bottom text on top of it - a background
    // fill doesn't change reading order, unlike a real second column.
    banner: { backgroundColor: BANNER_DARK, paddingVertical: 28, paddingHorizontal: 40 },
    bannerName: { fontSize: 22, fontWeight: bold, color: "#ffffff", marginBottom: 8 },
    bannerContactCol: { flexDirection: "column", gap: 3 },
    bannerContactText: { color: "#cbd5e1", fontSize: 10 },
    bannerLinkRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
    bannerLink: { color: "#93c5fd", textDecoration: "none" },
    linksRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: cfg.headerAlign === "center" ? "center" : "flex-start",
      gap: 10,
      marginTop: 3,
    },
    header: { marginBottom: template === "executive" ? 22 : 16, alignItems: cfg.headerAlign === "center" ? "center" : "flex-start" },
    name: {
      fontSize: template === "executive" ? 22 : 20,
      fontWeight: template === "executive" ? 400 : bold,
      letterSpacing: cfg.nameUppercase ? 3 : 0,
      textTransform: cfg.nameUppercase ? "uppercase" : "none",
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
    headerRule: template === "executive" ? { height: 0.5, backgroundColor: "#999999", marginTop: 10, width: "100%" } : { height: 0 },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: cfg.headerAlign === "center" ? "center" : "flex-start",
      gap: 6,
      marginTop: 14,
      marginBottom: 6,
    },
    sectionTitleBar: { width: 3, height: 10, backgroundColor: cfg.accent },
    sectionTitle: {
      fontSize: 11,
      fontWeight: bold,
      textTransform: template === "executive" ? "none" : "uppercase",
      letterSpacing: template === "executive" ? 2 : 1,
      color: cfg.accent,
    },
    sectionTitleUnderline: { borderBottom: "1pt solid #dddddd", paddingBottom: 3, flex: 1 },
    sectionTitleCenteredRule: { borderTop: "0.5pt solid #cccccc", paddingTop: 6, marginTop: 4 },
    entry: { marginBottom: template === "executive" ? 11 : 8 },
    entryHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { fontWeight: bold },
    entryDates: { color: "#666666" },
    entrySubtitle: { color: "#444444", marginBottom: 2, fontStyle: template === "executive" ? "italic" : "normal" },
    description: { color: "#333333", lineHeight: template === "executive" ? 1.6 : 1.4 },
    bulletRow: { flexDirection: "row", marginBottom: 2 },
    // A literal "•" depends on the font's encoding carrying U+2022, which is
    // exactly what was mangling bullets on the way in. Drawing the marker as
    // its own Text in a fixed-width column sidesteps the glyph question and
    // gives real hanging indentation, which a "• " prefix inside the text
    // never does (wrapped lines align under the marker, not the text).
    bulletMarker: { width: 10, color: template === "banner" ? cfg.accent : "#333333" },
    bulletText: { flex: 1, color: "#333333", lineHeight: 1.4 },
    descriptionHeading: { fontWeight: bold, color: "#1a1a1a", marginTop: 2, marginBottom: 1 },
    link: { color: link, textDecoration: template === "executive" ? "underline" : "none" },
    skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    skillsPlainText: { color: "#333333" },
    skillPill:
      cfg.skillsStyle === "pill-outline"
        ? { border: `0.75pt solid ${cfg.accent}`, color: cfg.accent, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6 }
        : { backgroundColor: "#f2f2f2", borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6 },
  });
}

type Styles = ReturnType<typeof buildStyles>;

/** Renders a section heading per the template's config - underline, accent bar, or a centered rule. Always plain top-to-bottom text, never a sidebar or box that would change reading order. */
function SectionTitle({ text, styles, sectionTitleStyle }: { text: string; styles: Styles; sectionTitleStyle: SectionTitleStyle }) {
  if (sectionTitleStyle === "accent-bar") {
    return (
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleBar} />
        <Text style={styles.sectionTitle}>{text}</Text>
      </View>
    );
  }
  if (sectionTitleStyle === "centered-rule") {
    return (
      <View style={styles.sectionTitleCenteredRule}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{text}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.sectionTitleRow, styles.sectionTitleUnderline]}>
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

function LinearResumeDocument({ content, template }: { content: ResumeContent; template: "classic" | "banner" | "executive" }) {
  const cfg = TEMPLATE_CONFIG[template];
  const styles = buildStyles(template);
  const { contact, summary, skills, experience, education, projects = [], additionalSections = [] } = content;
  const plainContact = [contact.email, contact.phone, contact.location].filter(Boolean) as string[];
  const title = (text: string) => <SectionTitle text={text} styles={styles} sectionTitleStyle={cfg.sectionTitleStyle} />;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {template === "banner" && (
          <View style={styles.banner}>
            {contact.name && <Text style={styles.bannerName}>{contact.name}</Text>}
            <View style={styles.bannerContactCol}>
              {plainContact.map((c, i) => (
                <Text key={`c-${i}`} style={styles.bannerContactText}>
                  {c}
                </Text>
              ))}
            </View>
            {contact.links.length > 0 && (
              <View style={styles.bannerLinkRow}>
                {contact.links.map((l, i) => {
                  const { label, href } = parseLinkLine(l);
                  return (
                    <Link key={`l-${i}`} src={href} style={styles.bannerLink}>
                      {label}
                    </Link>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={styles.body}>
          {template !== "banner" && (
            <View style={styles.header}>
              {contact.name && <Text style={styles.name}>{contact.name}</Text>}
              {plainContact.length > 0 && (
                <View style={styles.contactRow}>
                  {plainContact.map((c, i) => (
                    <Text key={`c-${i}`}>{c}</Text>
                  ))}
                </View>
              )}
              {contact.links.length > 0 && (
                <View style={styles.linksRow}>
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
              {template === "executive" && <View style={styles.headerRule} />}
            </View>
          )}

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
              {cfg.skillsStyle === "plain-list" ? (
                <Text style={styles.skillsPlainText}>{skills.join("  •  ")}</Text>
              ) : (
                <View style={styles.skillsRow}>
                  {skills.map((s, i) => (
                    <Text key={i} style={styles.skillPill}>
                      {s}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {additionalSections.map((s, i) => (
            <View key={i} wrap={false}>
              {title(s.heading)}
              <Description text={s.content} styles={styles} />
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

const sidebarStyles = StyleSheet.create({
  page: { flexDirection: "row", fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  // Wide enough that a full email or "linkedin.com/in/username" fits on one
  // or two wrapped lines rather than overflowing the coloured box - the
  // first version's 190pt was too narrow for real contact info.
  sidebar: { width: 230, minHeight: "100%", backgroundColor: BANNER_DARK, padding: 20 },
  sidebarName: { fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 14 },
  sidebarSectionTitle: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#93c5fd", marginTop: 16, marginBottom: 6 },
  // wordBreak so an unbroken long string (a URL, a long email) wraps
  // inside the column instead of running past its edge.
  sidebarText: { color: "#e2e8f0", marginBottom: 4, lineHeight: 1.4, fontSize: 9, wordBreak: "break-all" },
  sidebarLink: { color: "#93c5fd", textDecoration: "none", marginBottom: 4, fontSize: 9, wordBreak: "break-all" },
  sidebarSkill: { color: "#e2e8f0", marginBottom: 3, fontSize: 9, wordBreak: "break-all" },
  main: { flex: 1, padding: 28 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 6 },
  sectionTitleBar: { width: 3, height: 10, backgroundColor: BANNER_DARK },
  sectionTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#1a1a1a" },
  entry: { marginBottom: 8 },
  entryHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontWeight: 700 },
  entryDates: { color: "#666666" },
  entrySubtitle: { color: "#444444", marginBottom: 2 },
  description: { color: "#333333", lineHeight: 1.4 },
  bulletRow: { flexDirection: "row", marginBottom: 2 },
  bulletMarker: { width: 10, color: "#333333" },
  bulletText: { flex: 1, color: "#333333", lineHeight: 1.4 },
  descriptionHeading: { fontWeight: 700, color: "#1a1a1a", marginTop: 2, marginBottom: 1 },
  link: { color: "#2563eb", textDecoration: "none" },
});

/** Same rendering rules as Description/Segments above, duplicated rather than shared: Sidebar's styles object has a different shape (dark-sidebar text colors, no skillsRow/skillPill), and threading one generic type through both would cost more than these ~15 lines do. */
function SidebarSegments({ segments }: { segments: MarkdownSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.href ? (
          <Link key={i} src={seg.href} style={sidebarStyles.link}>
            {seg.text}
          </Link>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </>
  );
}

function SidebarDescription({ text }: { text: string }) {
  const lines = parseMarkdown(text);
  return (
    <View>
      {lines.map((line, i) => {
        if (line.type === "heading") {
          return (
            <Text key={i} style={sidebarStyles.descriptionHeading}>
              <SidebarSegments segments={line.segments} />
            </Text>
          );
        }
        if (line.type === "bullet") {
          return (
            <View key={i} style={sidebarStyles.bulletRow}>
              <Text style={sidebarStyles.bulletMarker}>•</Text>
              <Text style={sidebarStyles.bulletText}>
                <SidebarSegments segments={line.segments} />
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={sidebarStyles.description}>
            <SidebarSegments segments={line.segments} />
          </Text>
        );
      })}
    </View>
  );
}

function SidebarSectionTitle({ text }: { text: string }) {
  return (
    <View style={sidebarStyles.sectionTitleRow}>
      <View style={sidebarStyles.sectionTitleBar} />
      <Text style={sidebarStyles.sectionTitle}>{text}</Text>
    </View>
  );
}

/**
 * A real two-column layout: dark sidebar (contact, skills, education) next
 * to a main column (summary, experience, projects, additional sections).
 * NOT claimed ATS-safe - see templates.ts's doc comment. This exists
 * because a user explicitly asked for a visually distinct option and
 * agreed to be told plainly if it isn't ATS-safe, not because the
 * structural risk stopped applying.
 */
function SidebarDocument({ content }: { content: ResumeContent }) {
  const { contact, summary, skills, experience, education, projects = [], additionalSections = [] } = content;
  const plainContact = [contact.email, contact.phone, contact.location].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="LETTER" style={sidebarStyles.page} wrap>
        <View style={sidebarStyles.sidebar}>
          {contact.name && <Text style={sidebarStyles.sidebarName}>{contact.name}</Text>}

          <Text style={sidebarStyles.sidebarSectionTitle}>Contact</Text>
          {plainContact.map((c, i) => (
            <Text key={`c-${i}`} style={sidebarStyles.sidebarText}>
              {c}
            </Text>
          ))}
          {contact.links.map((l, i) => {
            const { label, href } = parseLinkLine(l);
            return (
              <Link key={`l-${i}`} src={href} style={sidebarStyles.sidebarLink}>
                {label}
              </Link>
            );
          })}

          {skills.length > 0 && (
            <>
              <Text style={sidebarStyles.sidebarSectionTitle}>Skills</Text>
              {skills.map((s, i) => (
                <Text key={i} style={sidebarStyles.sidebarSkill}>
                  {s}
                </Text>
              ))}
            </>
          )}

          {education.length > 0 && (
            <>
              <Text style={sidebarStyles.sidebarSectionTitle}>Education</Text>
              {education.map((ed, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <Text style={sidebarStyles.sidebarText}>{ed.school ?? "Untitled school"}</Text>
                  {ed.degree && <Text style={sidebarStyles.sidebarText}>{ed.degree}</Text>}
                  {ed.dates && <Text style={sidebarStyles.sidebarText}>{ed.dates}</Text>}
                </View>
              ))}
            </>
          )}
        </View>

        <View style={sidebarStyles.main}>
          {summary && (
            <View>
              <SidebarSectionTitle text="Summary" />
              <SidebarDescription text={summary} />
            </View>
          )}

          {experience.length > 0 && (
            <View>
              <SidebarSectionTitle text="Experience" />
              {experience.map((exp, i) => (
                <View key={i} style={sidebarStyles.entry} wrap={false}>
                  <View style={sidebarStyles.entryHeaderRow}>
                    <Text style={sidebarStyles.entryTitle}>{exp.title ?? "Untitled role"}</Text>
                    {exp.dates && <Text style={sidebarStyles.entryDates}>{exp.dates}</Text>}
                  </View>
                  {exp.company && <Text style={sidebarStyles.entrySubtitle}>{exp.company}</Text>}
                  {exp.description && <SidebarDescription text={exp.description} />}
                </View>
              ))}
            </View>
          )}

          {projects.length > 0 && (
            <View>
              <SidebarSectionTitle text="Projects" />
              {projects.map((pr, i) => (
                <View key={i} style={sidebarStyles.entry} wrap={false}>
                  <Text style={sidebarStyles.entryTitle}>{pr.name ?? "Untitled project"}</Text>
                  {pr.description && <SidebarDescription text={pr.description} />}
                </View>
              ))}
            </View>
          )}

          {additionalSections.map((s, i) => (
            <View key={i} wrap={false}>
              <SidebarSectionTitle text={s.heading} />
              <SidebarDescription text={s.content} />
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export function ResumePdfDocument({
  content,
  template = "classic",
}: {
  content: ResumeContent;
  template?: ResumeTemplate;
}) {
  if (template === "sidebar") return <SidebarDocument content={content} />;
  return <LinearResumeDocument content={content} template={template} />;
}
