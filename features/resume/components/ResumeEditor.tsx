"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Typography } from "@/components/ui/Typography";
import type { ResumeContent } from "../db/schema";
import { updateResume } from "../actions/resumes";

/** Every parsed field is editable here by design - the parser is a best-effort head start (see lib/parse.ts), so the user always gets the final say. */
export function ResumeEditor({
  id,
  initialTitle,
  initialContent,
  onSaved,
}: {
  id: string;
  initialTitle: string;
  initialContent: ResumeContent;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [content, setContent] = React.useState<ResumeContent>(initialContent);
  const [pending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState(false);

  const dirty =
    title !== initialTitle || JSON.stringify(content) !== JSON.stringify(initialContent);

  function setContact<K extends keyof ResumeContent["contact"]>(
    key: K,
    value: ResumeContent["contact"][K]
  ) {
    setContent((c) => ({ ...c, contact: { ...c.contact, [key]: value } }));
  }

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateResume({ id, title, content });
      setSaved(true);
      onSaved?.();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label className="text-sm font-medium">Resume name</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
      </div>

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
      </section>

      <section className="space-y-3">
        <Typography variant="overline">Summary</Typography>
        <Textarea
          rows={4}
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
            <Textarea
              rows={3}
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

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        {saved && !dirty && (
          <Typography variant="small" className="text-muted-foreground">
            Saved
          </Typography>
        )}
        <Button disabled={!dirty || pending} onClick={save}>
          {pending ? "Saving..." : "Save resume"}
        </Button>
      </div>
    </div>
  );
}
