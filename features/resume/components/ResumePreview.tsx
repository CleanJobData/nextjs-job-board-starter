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
 * one data shape (ResumeContent), not one shared component. Unlike the PDF
 * side, Segments/Description/ContactLinks below need no per-template style
 * object (plain Tailwind classes), so they're reused as-is by every
 * template including Sidebar, rather than duplicated.
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
function Description({ text, className }: { text: string; className?: string }) {
  const lines = parseMarkdown(text);
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.type === "heading") {
          return (
            <Typography key={i} className={`font-semibold mt-1 ${className ?? ""}`}>
              <Segments segments={line.segments} />
            </Typography>
          );
        }
        if (line.type === "bullet") {
          return (
            <ul key={i} className={`list-disc pl-5 ${className ?? "text-muted-foreground"}`}>
              <li>
                <Segments segments={line.segments} />
              </li>
            </ul>
          );
        }
        return (
          <Typography key={i} variant={className ? undefined : "muted"} className={className}>
            <Segments segments={line.segments} />
          </Typography>
        );
      })}
    </div>
  );
}

function ContactLinks({ links, className }: { links: string[]; className?: string }) {
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
            className={className ?? "text-primary hover:underline"}
          >
            {label}
          </a>
        );
      })}
    </>
  );
}

const BANNER_DARK = "#1e293b";
const ACCENT = "#0f766e";

function SectionHeading({
  text,
  template,
}: {
  text: string;
  template: "classic" | "banner" | "executive";
}) {
  if (template === "banner") {
    return (
      <div className="mb-2 mt-4 flex items-center gap-1.5">
        <span className="h-2.5 w-[3px]" style={{ backgroundColor: ACCENT }} />
        <Typography variant="overline" style={{ color: ACCENT }}>
          {text}
        </Typography>
      </div>
    );
  }
  if (template === "executive") {
    return (
      <div className="mt-4 mb-2 border-t border-border pt-2 text-center">
        <Typography variant="overline" className="normal-case tracking-normal text-foreground">
          {text}
        </Typography>
      </div>
    );
  }
  return (
    <Typography variant="overline" className="mt-4 mb-2 block border-b border-border pb-1">
      {text}
    </Typography>
  );
}

/** Classic, Banner, and Executive: one column, differing only in header composition, colour, and typeface. */
function LinearPreview({
  content,
  template,
}: {
  content: ResumeContent;
  template: "classic" | "banner" | "executive";
}) {
  const { contact, summary, skills, experience, education, projects = [], additionalSections = [] } = content;
  const plainContact = [contact.email, contact.phone, contact.location].filter(Boolean) as string[];
  const serif = template === "executive" ? "font-serif" : "";

  return (
    <div className={`text-sm ${serif}`}>
      {template === "banner" ? (
        <div className="-mx-6 -mt-6 mb-4 px-6 py-6 rounded-t-lg" style={{ backgroundColor: BANNER_DARK }}>
          {contact.name && <Typography variant="h3" className="text-white">{contact.name}</Typography>}
          <div className="mt-2 flex flex-col gap-0.5 text-sm" style={{ color: "#cbd5e1" }}>
            {plainContact.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
            <ContactLinks links={contact.links} className="text-sky-300 hover:underline" />
          </div>
        </div>
      ) : (
        <div className={template === "executive" ? "text-center" : "text-left"}>
          {contact.name && (
            <Typography
              variant="h3"
              className={template === "executive" ? "font-normal uppercase tracking-[0.2em]" : undefined}
            >
              {contact.name}
            </Typography>
          )}
          {(plainContact.length > 0 || contact.links.length > 0) && (
            <div
              className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground ${
                template === "executive" ? "justify-center" : ""
              }`}
            >
              {plainContact.map((c, i) => (
                <span key={i}>{c}</span>
              ))}
              <ContactLinks links={contact.links} />
            </div>
          )}
          {template === "executive" && <div className="mt-3 border-t border-border" />}
        </div>
      )}

      <div className="space-y-4">
        {summary && (
          <section>
            <SectionHeading text="Summary" template={template} />
            <Description text={summary} />
          </section>
        )}

        {experience.length > 0 && (
          <section className="space-y-3">
            <SectionHeading text="Experience" template={template} />
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
                  <Typography
                    variant="small"
                    className={template === "executive" ? "italic text-muted-foreground" : "text-muted-foreground"}
                  >
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
            <SectionHeading text="Education" template={template} />
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
            <SectionHeading text="Projects" template={template} />
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
            <SectionHeading text="Skills" template={template} />
            {template === "executive" ? (
              <Typography variant="muted">{skills.join("  •  ")}</Typography>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, i) =>
                  template === "banner" ? (
                    <span
                      key={i}
                      className="rounded-md border px-2 py-0.5 text-xs"
                      style={{ borderColor: ACCENT, color: ACCENT }}
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
          <section key={i}>
            <SectionHeading text={s.heading} template={template} />
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
    </div>
  );
}

/**
 * Real two-column layout: dark sidebar (contact/skills/education) next to
 * a main column (summary/experience/projects/additional sections) - the
 * same structure as lib/pdf.tsx's SidebarDocument. NOT ATS-safe; see
 * templates.ts's doc comment. Kept as its own component rather than a
 * branch of LinearPreview because the layout is genuinely two columns,
 * not a header/colour variant of one.
 */
function SidebarPreview({ content }: { content: ResumeContent }) {
  const { contact, summary, skills, experience, education, projects = [], additionalSections = [] } = content;
  const plainContact = [contact.email, contact.phone, contact.location].filter(Boolean) as string[];

  return (
    <div className="flex text-sm -m-6 rounded-lg overflow-hidden border border-border">
      <aside className="w-48 shrink-0 p-5 space-y-4" style={{ backgroundColor: BANNER_DARK, color: "#e2e8f0" }}>
        {contact.name && <Typography variant="h4" className="text-white">{contact.name}</Typography>}

        <div>
          <Typography variant="overline" className="text-sky-300">Contact</Typography>
          <div className="mt-1 flex flex-col gap-1">
            {plainContact.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
            <ContactLinks links={contact.links} className="text-sky-300 hover:underline break-words" />
          </div>
        </div>

        {skills.length > 0 && (
          <div>
            <Typography variant="overline" className="text-sky-300">Skills</Typography>
            <div className="mt-1 flex flex-col gap-1">
              {skills.map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <Typography variant="overline" className="text-sky-300">Education</Typography>
            <div className="mt-1 space-y-2">
              {education.map((ed, i) => (
                <div key={i}>
                  <div>{ed.school ?? "Untitled school"}</div>
                  {ed.degree && <div className="opacity-80">{ed.degree}</div>}
                  {ed.dates && <div className="opacity-80">{ed.dates}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 p-5 space-y-4">
        {summary && (
          <section>
            <SectionHeading text="Summary" template="classic" />
            <Description text={summary} />
          </section>
        )}

        {experience.length > 0 && (
          <section className="space-y-3">
            <SectionHeading text="Experience" template="classic" />
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

        {projects.length > 0 && (
          <section className="space-y-3">
            <SectionHeading text="Projects" template="classic" />
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

        {additionalSections.map((s, i) => (
          <section key={i}>
            <SectionHeading text={s.heading} template="classic" />
            <Description text={s.content} />
          </section>
        ))}

        {!summary && experience.length === 0 && projects.length === 0 && additionalSections.length === 0 && (
          <Typography variant="muted">Nothing added yet - use Edit to fill this in.</Typography>
        )}
      </div>
    </div>
  );
}

export function ResumePreview({
  content,
  template = "classic",
}: {
  content: ResumeContent;
  template?: ResumeTemplate;
}) {
  if (template === "sidebar") return <SidebarPreview content={content} />;
  return <LinearPreview content={content} template={template} />;
}
