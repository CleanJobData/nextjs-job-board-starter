import * as React from "react";
import { Typography } from "@/components/ui/Typography";
import type { ResumeContent } from "../db/schema";
import { parseMarkdown, parseLinkLine, type MarkdownSegment } from "../lib/markdown";
import type { ResumeTemplate } from "../lib/templates";

/**
 * Read-only formatted rendering of a resume's structured content - the
 * thing that was missing entirely for a "created" resume (no original
 * file to fall back to viewing) and, arguably, more useful than the raw
 * PDF for an uploaded one too, since it reflects any edits made after
 * upload.
 *
 * Deliberately a plain HTML rendering rather than reusing ResumePdfDocument
 * (lib/pdf.tsx) - @react-pdf/renderer's primitives (Document/Page/View)
 * only render to PDF output, not to a normal DOM tree, so a fast in-app
 * preview and the downloadable PDF are necessarily two renderers sharing
 * one data shape (ResumeContent), not one shared component.
 */

function Segments({ segments }: { segments: MarkdownSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.href ? (
          <a
            key={i}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {seg.text}
          </a>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
}

/** Mirrors lib/pdf.tsx's Description, both driven by lib/markdown.ts, so the on-screen preview and the downloaded PDF can't disagree. */
function Description({ text }: { text: string }) {
  const lines = parseMarkdown(text);
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.type === "heading") {
          return (
            <Typography key={i} className="font-semibold mt-1">
              <Segments segments={line.segments} />
            </Typography>
          );
        }
        if (line.type === "bullet") {
          return (
            <ul key={i} className="list-disc pl-5 text-muted-foreground">
              <li>
                <Segments segments={line.segments} />
              </li>
            </ul>
          );
        }
        return (
          <Typography key={i} variant="muted">
            <Segments segments={line.segments} />
          </Typography>
        );
      })}
    </div>
  );
}

function ContactLinks({ links }: { links: string[] }) {
  return (
    <>
      {links.map((l, i) => {
        const { label, href } = parseLinkLine(l);
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {label}
          </a>
        );
      })}
    </>
  );
}

const MODERN_ACCENT = "#0f766e";

export function ResumePreview({
  content,
  template = "classic",
}: {
  content: ResumeContent;
  template?: ResumeTemplate;
}) {
  const { contact, summary, skills, experience, education, projects = [], additionalSections = [] } = content;
  const plainContact = [contact.email, contact.phone, contact.location].filter(Boolean) as string[];
  const accentStyle = template === "modern" ? { color: MODERN_ACCENT } : undefined;
  const sectionTitleClass = template === "executive" ? "normal-case tracking-normal text-foreground" : undefined;
  const headerAlign = template === "classic" ? "text-left" : "text-center";
  const serif = template === "executive" ? "font-serif" : undefined;

  return (
    <div className={`space-y-6 text-sm ${serif ?? ""}`}>
      <div className={headerAlign}>
        {contact.name && (
          <Typography
            variant="h3"
            style={accentStyle}
            className={template === "executive" ? "font-normal uppercase tracking-[0.2em]" : undefined}
          >
            {contact.name}
          </Typography>
        )}
        {(plainContact.length > 0 || contact.links.length > 0) && (
          <div
            className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground ${
              template !== "classic" ? "justify-center" : ""
            }`}
          >
            {plainContact.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
            <ContactLinks links={contact.links} />
          </div>
        )}
      </div>

      {summary && (
        <section>
          <Typography variant="overline" className={`mb-2 ${sectionTitleClass ?? ""}`} style={accentStyle}>Summary</Typography>
          <Description text={summary} />
        </section>
      )}

      {experience.length > 0 && (
        <section className="space-y-3">
          <Typography variant="overline" className={sectionTitleClass} style={accentStyle}>Experience</Typography>
          {experience.map((exp, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <Typography className="font-semibold">{exp.title ?? "Untitled role"}</Typography>
                {exp.dates && (
                  <Typography variant="small" className="text-muted-foreground shrink-0">
                    {exp.dates}
                  </Typography>
                )}
              </div>
              {exp.company && (
                <Typography variant="small" className="text-muted-foreground">
                  {exp.company}
                </Typography>
              )}
              {exp.description && (
                <div className="mt-1">
                  <Description text={exp.description} />
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="space-y-3">
          <Typography variant="overline" className={sectionTitleClass} style={accentStyle}>Education</Typography>
          {education.map((ed, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <Typography className="font-semibold">{ed.school ?? "Untitled school"}</Typography>
                {ed.dates && (
                  <Typography variant="small" className="text-muted-foreground shrink-0">
                    {ed.dates}
                  </Typography>
                )}
              </div>
              {ed.degree && (
                <Typography variant="small" className="text-muted-foreground">
                  {ed.degree}
                </Typography>
              )}
            </div>
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section className="space-y-3">
          <Typography variant="overline" className={sectionTitleClass} style={accentStyle}>Projects</Typography>
          {projects.map((pr, i) => (
            <div key={i}>
              <Typography className="font-semibold">{pr.name ?? "Untitled project"}</Typography>
              {pr.description && (
                <div className="mt-1">
                  <Description text={pr.description} />
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <Typography variant="overline" className={`mb-2 ${sectionTitleClass ?? ""}`} style={accentStyle}>Skills</Typography>
          {template === "executive" ? (
            <Typography variant="muted">{skills.join("  •  ")}</Typography>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) =>
                template === "modern" ? (
                  <span
                    key={i}
                    className="rounded-md border px-2 py-0.5 text-xs"
                    style={{ borderColor: MODERN_ACCENT, color: MODERN_ACCENT }}
                  >
                    {s}
                  </span>
                ) : (
                  <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                    {s}
                  </span>
                )
              )}
            </div>
          )}
        </section>
      )}

      {additionalSections.map((s, i) => (
        <section key={i} className="space-y-2">
          <Typography variant="overline" className={sectionTitleClass} style={accentStyle}>{s.heading}</Typography>
          <Description text={s.content} />
        </section>
      ))}

      {!summary &&
        experience.length === 0 &&
        education.length === 0 &&
        skills.length === 0 &&
        projects.length === 0 &&
        additionalSections.length === 0 && (
          <Typography variant="muted">Nothing added yet - use Edit to fill this in.</Typography>
        )}
    </div>
  );
}
