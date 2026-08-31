"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowUpRightFromSquare, FaDownload, FaWandMagicSparkles } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteResume, reextractResume, setDefaultResume } from "../actions/resumes";

/** The interactive half of the /resume/[id] preview page - kept separate from the server-rendered page since these need client state (pending/transitions) and router navigation. */
export function ResumeDetailActions({
  id,
  title,
  fileUrl,
  isDefault,
}: {
  id: string;
  title: string;
  fileUrl: string | null;
  isDefault: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" asChild>
        <Link href={`/resume/${id}/edit`}>Edit</Link>
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <a href={`/api/resume/${id}/pdf`}>
          <FaDownload className="h-3 w-3 mr-1.5" /> Download PDF
        </a>
      </Button>
      {fileUrl && (
        <Button size="sm" variant="ghost" asChild>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            Original <FaArrowUpRightFromSquare className="ml-1.5 h-3 w-3" />
          </a>
        </Button>
      )}
      {fileUrl && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          title="Re-read the original PDF and re-run extraction, parsing and the ATS check"
          onClick={() =>
            startTransition(async () => {
              await reextractResume(id);
              router.refresh();
            })
          }
        >
          <FaWandMagicSparkles className="h-3 w-3 mr-1.5" /> Re-analyse
        </Button>
      )}
      {!isDefault && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setDefaultResume(id);
              router.refresh();
            })
          }
        >
          Make default
        </Button>
      )}
      <ConfirmDialog
        trigger={
          <Button size="sm" variant="ghost" disabled={pending}>
            Delete
          </Button>
        }
        title="Delete this resume?"
        description={`This permanently deletes "${title}"${fileUrl ? " and its uploaded file" : ""}. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={() =>
          startTransition(async () => {
            await deleteResume(id);
            router.push("/resume");
          })
        }
      />
    </div>
  );
}
