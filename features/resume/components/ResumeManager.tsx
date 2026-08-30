"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FaFileLines, FaStar, FaArrowUpRightFromSquare, FaWandMagicSparkles } from "react-icons/fa6";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import type { ResumeContent } from "../db/schema";
import {
  createResume,
  deleteResume,
  reparseResume,
  setDefaultResume,
  uploadResume,
} from "../actions/resumes";
import { ResumeEditor } from "./ResumeEditor";

export type ResumeRow = {
  id: string;
  title: string;
  source: "uploaded" | "created";
  fileUrl: string | null;
  fileName: string | null;
  hasRawText: boolean;
  isDefault: boolean;
  content: ResumeContent;
  updatedAt: string;
};

export function ResumeManager({ resumes }: { resumes: ResumeRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<ResumeRow | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        await uploadResume({ file });
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Upload failed.");
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  function onCreate() {
    setError(null);
    startTransition(async () => {
      try {
        await createResume({ title: newTitle });
        setCreating(false);
        setNewTitle("");
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Could not create resume.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="h4">Your resumes</Typography>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={onUpload}
            disabled={pending}
            className="hidden"
            id="resume-upload"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            {pending ? "Working..." : "Upload PDF"}
          </Button>
          <Button size="sm" disabled={pending} onClick={() => setCreating(true)}>
            Create from scratch
          </Button>
        </div>
      </div>

      {error && <Typography variant="small" className="text-destructive">{error}</Typography>}

      {resumes.length === 0 ? (
        <EmptyState
          icon={<FaFileLines />}
          title="No resumes yet"
          description="Upload a PDF to have its details pulled out automatically, or build one from scratch."
        />
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => (
            <Card key={r.id} className="transition-colors hover:border-foreground/20">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Typography className="font-semibold truncate">{r.title}</Typography>
                    {r.isDefault && (
                      <Badge variant="accent" className="gap-1">
                        <FaStar className="h-2.5 w-2.5" /> Default
                      </Badge>
                    )}
                    <Badge variant="secondary" className="capitalize">{r.source}</Badge>
                  </div>
                  <Typography variant="small" className="text-muted-foreground">
                    Updated {new Date(r.updatedAt).toLocaleDateString()}
                    {r.fileName ? ` - ${r.fileName}` : ""}
                  </Typography>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {r.fileUrl && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer">
                        Original <FaArrowUpRightFromSquare className="ml-1.5 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  {r.hasRawText && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      title="Run the parser over this resume again"
                      onClick={() =>
                        startTransition(async () => {
                          await reparseResume(r.id);
                          router.refresh();
                        })
                      }
                    >
                      <FaWandMagicSparkles className="h-3 w-3 mr-1.5" /> Re-parse
                    </Button>
                  )}
                  {!r.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await setDefaultResume(r.id);
                          router.refresh();
                        })
                      }
                    >
                      Make default
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                    Edit
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button size="sm" variant="ghost" disabled={pending}>
                        Delete
                      </Button>
                    }
                    title="Delete this resume?"
                    description={`This permanently deletes "${r.title}"${r.fileUrl ? " and its uploaded file" : ""}. This can't be undone.`}
                    confirmLabel="Delete"
                    onConfirm={() =>
                      startTransition(async () => {
                        await deleteResume(r.id);
                        router.refresh();
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.title}` : undefined}
        className="max-w-3xl"
      >
        {editing && (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <ResumeEditor
              id={editing.id}
              initialTitle={editing.title}
              initialContent={editing.content}
              onSaved={() => setEditing(null)}
            />
          </div>
        )}
      </Dialog>

      <Dialog isOpen={creating} onClose={() => setCreating(false)} title="Create a resume" className="max-w-md">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Resume name</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Backend engineer resume"
              disabled={pending}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setCreating(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={pending || !newTitle.trim()}>
              {pending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
