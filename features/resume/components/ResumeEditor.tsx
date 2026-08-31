"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaTrash, FaTriangleExclamation } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Typography } from "@/components/ui/Typography";
import type { ResumeContent } from "../db/schema";
import { updateResume } from "../actions/resumes";
import { parseLinkLine } from "../lib/markdown";
import { MarkdownHelp } from "./MarkdownHelp";
import { ResumePreview } from "./ResumePreview";
import { RESUME_TEMPLATES, type ResumeTemplate } from "../lib/templates";

/** Every parsed field is editable here by design - the parser is a best-effort head start (see lib/parse.ts), so the user always gets the final say. */
export function ResumeEditor({
  id,
  initialTitle,
  initialContent,
  initialTemplate = "classic",
}: {
  id: string;
  initialTitle: string;
  initialContent: ResumeContent;
  initialTemplate?: ResumeTemplate;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [template, setTemplate] = React.useState<ResumeTemplate>(initialTemplate);
  // Defensive defaults, not just types: rows saved before `projects`/
  // `additionalSections` existed are still real JSONB in the DB with those
  // keys simply absent, and there's no migration step for a JSONB column.
  const [content, setContent] = React.useState<ResumeContent>(() => ({
    ...initialContent,
    projects: initialContent.projects ?? [],
    additionalSections: initialContent.additionalSections ?? [],
  }));
  const [pending, startTransition] = React.useTransition();

  const dirty =
    title !== initialTitle ||
    template !== initialTemplate ||
    JSON.stringify(content) !== JSON.stringify(initialContent);

  function setContact<K extends keyof ResumeContent["contact"]>(
    key: K,
    value: ResumeContent["contact"][K]
  ) {
    setContent((c) => ({ ...c, contact: { ...c.contact, [key]: value } }));
  }

  function save() {
    startTransition(async () => {
      await updateResume({ id, title, content, template });
      router.push(`/resume/${id}`);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
    <div className="space-y-6">
      <div className="space-y-1">
        <label className="text-sm font-medium">Resume name</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
      </div>

      <section className="space-y-3">
        <Typography variant="overline">Template</Typography>
        <div className="grid grid-cols-2 gap-3">
          {RESUME_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={pending}
              onClick={() => setTemplate(t.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                template === t.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Typography className="font-semibold">{t.label}</Typography>
                {!t.atsSafe && (
                  <FaTriangleExclamation className="h-3 w-3 text-warning" title="Not reliably ATS-safe" />
                )}
              </div>
              <Typography variant="small" className="text-muted-foreground">
                {t.description}
              </Typography>
              {!t.atsSafe && (
                <Typography variant="small" className="mt-1 text-warning">
                  Two-column layout - many ATS parsers scramble this. Use for direct human review, not blind
                  online applications.
                </Typography>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Typography variant="overline">Contact</Typography>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Full name"
            value={content.contact.name ?? ""}
            onChange={(e) => setContact("name", e.target.value || null)}
            disabled={pending}
          />
          <Input
            placeholder="Email"
            value={content.contact.email ?? ""}
            onChange={(e) => setContact("email", e.target.value || null)}
            disabled={pending}
          />
          <Input
            placeholder="Phone"
            value={content.contact.phone ?? ""}
            onChange={(e) => setContact("phone", e.target.value || null)}
            disabled={pending}
          />
          <Input
            placeholder="Location"
            value={content.contact.location ?? ""}
            onChange={(e) => setContact("location", e.target.value || null)}
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1.5">
            <Typography variant="small" className="font-medium">Links</Typography>
            <MarkdownHelp />
          </div>
          <Textarea
            rows={3}
            placeholder={"[Portfolio](https://example.com)\ngithub.com/you\nlinkedin.com/in/you"}
            value={content.contact.links.join("\n")}
            onChange={(e) =>
              setContact(
                "links",
                e.target.value.split("\n").map((l) => l.trim()).filter(Boolean)
              )
            }
            disabled={pending}
          />
          {content.contact.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {content.contact.links.map((l, i) => {
                const { label, href } = parseLinkLine(l);
                return (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={href}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs text-primary hover:underline"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-1.5">
          <Typography variant="overline">Summary</Typography>
          <MarkdownHelp />
        </div>
        <Textarea
          rows={4}
          className="min-h-[400px]"
          placeholder="A short professional summary..."
          value={content.summary ?? ""}
          onChange={(e) => setContent((c) => ({ ...c, summary: e.target.value || null }))}
          disabled={pending}
        />
      </section>

      <section className="space-y-3">
        <Typography variant="overline">Skills</Typography>
        <Input
          placeholder="TypeScript, Postgres, Kubernetes"
          value={content.skills.join(", ")}
          onChange={(e) =>
            setContent((c) => ({
              ...c,
              skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            }))
          }
          disabled={pending}
        />
        <Typography variant="small" className="text-muted-foreground">
          Separate with commas.
        </Typography>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Typography variant="overline">Experience</Typography>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              setContent((c) => ({
                ...c,
                experience: [...c.experience, { title: null, company: null, dates: null, description: null }],
              }))
            }
          >
            <FaPlus className="h-3 w-3 mr-1.5" /> Add
          </Button>
        </div>
        {content.experience.length === 0 && (
          <Typography variant="muted">No experience added yet.</Typography>
        )}
        {content.experience.map((exp, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Job title"
                value={exp.title ?? ""}
                onChange={(e) =>
                  setContent((c) => {
                    const next = [...c.experience];
                    next[i] = { ...next[i]!, title: e.target.value || null };
                    return { ...c, experience: next };
                  })
                }
                disabled={pending}
              />
              <Input
                placeholder="Company"
                value={exp.company ?? ""}
                onChange={(e) =>
                  setContent((c) => {
                    const next = [...c.experience];
                    next[i] = { ...next[i]!, company: e.target.value || null };
                    return { ...c, experience: next };
                  })
                }
                disabled={pending}
              />
              <Input
                placeholder="2020 - Present"
                value={exp.dates ?? ""}
                onChange={(e) =>
                  setContent((c) => {
                    const next = [...c.experience];
                    next[i] = { ...next[i]!, dates: e.target.value || null };
                    return { ...c, experience: next };
                  })
                }
                disabled={pending}
              />
            </div>
            <div className="flex items-center justify-between gap-1.5">
              <Typography variant="small" className="text-muted-foreground">Description</Typography>
              <MarkdownHelp />
            </div>
            <Textarea
              rows={3}
              className="min-h-[400px]"
              placeholder="What you worked on..."
              value={exp.description ?? ""}
              onChange={(e) =>
                setContent((c) => {
                  const next = [...c.experience];
                  next[i] = { ...next[i]!, description: e.target.value || null };
                  return { ...c, experience: next };
                })
              }
              disabled={pending}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  setContent((c) => ({ ...c, experience: c.experience.filter((_, j) => j !== i) }))
                }
              >
                <FaTrash className="h-3 w-3 mr-1.5" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Typography variant="overline">Education</Typography>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              setContent((c) => ({
                ...c,
                education: [...c.education, { school: null, degree: null, dates: null }],
              }))
            }
          >
            <FaPlus className="h-3 w-3 mr-1.5" /> Add
          </Button>
        </div>
        {content.education.length === 0 && (
          <Typography variant="muted">No education added yet.</Typography>
        )}
        {content.education.map((ed, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="School"
                value={ed.school ?? ""}
                onChange={(e) =>
                  setContent((c) => {
                    const next = [...c.education];
                    next[i] = { ...next[i]!, school: e.target.value || null };
                    return { ...c, education: next };
                  })
                }
                disabled={pending}
              />
              <Input
                placeholder="Degree"
                value={ed.degree ?? ""}
                onChange={(e) =>
                  setContent((c) => {
                    const next = [...c.education];
                    next[i] = { ...next[i]!, degree: e.target.value || null };
                    return { ...c, education: next };
                  })
                }
                disabled={pending}
              />
              <Input
                placeholder="2012 - 2016"
                value={ed.dates ?? ""}
                onChange={(e) =>
                  setContent((c) => {
                    const next = [...c.education];
                    next[i] = { ...next[i]!, dates: e.target.value || null };
                    return { ...c, education: next };
                  })
                }
                disabled={pending}
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  setContent((c) => ({ ...c, education: c.education.filter((_, j) => j !== i) }))
                }
              >
                <FaTrash className="h-3 w-3 mr-1.5" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Typography variant="overline">Projects</Typography>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              setContent((c) => ({
                ...c,
                projects: [...c.projects, { name: null, description: null }],
              }))
            }
          >
            <FaPlus className="h-3 w-3 mr-1.5" /> Add
          </Button>
        </div>
        {content.projects.length === 0 && (
          <Typography variant="muted">No projects added yet.</Typography>
        )}
        {content.projects.map((pr, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-3">
            <Input
              placeholder="Project name"
              value={pr.name ?? ""}
              onChange={(e) =>
                setContent((c) => {
                  const next = [...c.projects];
                  next[i] = { ...next[i]!, name: e.target.value || null };
                  return { ...c, projects: next };
                })
              }
              disabled={pending}
            />
            <div className="flex items-center justify-between gap-1.5">
              <Typography variant="small" className="text-muted-foreground">Description</Typography>
              <MarkdownHelp />
            </div>
            <Textarea
              rows={3}
              className="min-h-[400px]"
              placeholder="What it does, your role, tech used..."
              value={pr.description ?? ""}
              onChange={(e) =>
                setContent((c) => {
                  const next = [...c.projects];
                  next[i] = { ...next[i]!, description: e.target.value || null };
                  return { ...c, projects: next };
                })
              }
              disabled={pending}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  setContent((c) => ({ ...c, projects: c.projects.filter((_, j) => j !== i) }))
                }
              >
                <FaTrash className="h-3 w-3 mr-1.5" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Typography variant="overline">Additional sections</Typography>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              setContent((c) => ({
                ...c,
                additionalSections: [...c.additionalSections, { heading: "", content: "" }],
              }))
            }
          >
            <FaPlus className="h-3 w-3 mr-1.5" /> Add
          </Button>
        </div>
        <Typography variant="small" className="text-muted-foreground">
          Certifications, awards, languages, volunteering - anything that doesn&apos;t fit the sections above.
        </Typography>
        {content.additionalSections.length === 0 && (
          <Typography variant="muted">No additional sections added yet.</Typography>
        )}
        {content.additionalSections.map((s, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-3">
            <Input
              placeholder="Section heading, e.g. Certifications"
              value={s.heading}
              onChange={(e) =>
                setContent((c) => {
                  const next = [...c.additionalSections];
                  next[i] = { ...next[i]!, heading: e.target.value };
                  return { ...c, additionalSections: next };
                })
              }
              disabled={pending}
            />
            <div className="flex items-center justify-between gap-1.5">
              <Typography variant="small" className="text-muted-foreground">Content</Typography>
              <MarkdownHelp />
            </div>
            <Textarea
              rows={3}
              className="min-h-[400px]"
              placeholder={"- AWS Certified Solutions Architect (2022)\n- Spanish (Fluent)"}
              value={s.content}
              onChange={(e) =>
                setContent((c) => {
                  const next = [...c.additionalSections];
                  next[i] = { ...next[i]!, content: e.target.value };
                  return { ...c, additionalSections: next };
                })
              }
              disabled={pending}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  setContent((c) => ({
                    ...c,
                    additionalSections: c.additionalSections.filter((_, j) => j !== i),
                  }))
                }
              >
                <FaTrash className="h-3 w-3 mr-1.5" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button variant="outline" disabled={pending} onClick={() => router.push(`/resume/${id}`)}>
          Cancel
        </Button>
        <Button disabled={!dirty || pending} onClick={save}>
          {pending ? "Saving..." : "Save resume"}
        </Button>
      </div>
    </div>

    <div className="lg:sticky lg:top-6 space-y-3">
      <Typography variant="overline">Live preview</Typography>
      <div className="rounded-lg border border-border p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <ResumePreview content={content} template={template} />
      </div>
    </div>
    </div>
  );
}
