"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import type { AdminPostingRow } from "../actions/postings";
import { approvePosting, rejectPosting } from "../actions/postings";

const STATUS_VARIANT: Record<AdminPostingRow["status"], "secondary" | "accent" | "destructive"> = {
  pending: "secondary",
  approved: "accent",
  rejected: "destructive",
};

/** One posting in the moderation queue - inline expand for reject-reason entry rather than a separate detail route, since the row already carries everything needed to act (title/company/link/status). */
export function PostingRow({ posting }: { posting: AdminPostingRow }) {
  const router = useRouter();
  const [status, setStatus] = useState(posting.status);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      await approvePosting(posting.id);
      setStatus("approved");
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectPosting(posting.id, reason);
      setStatus("rejected");
      setRejecting(false);
      router.refresh();
    });
  }

  return (
    <Card className="p-4 flex flex-col gap-3">
      {/* Judgement call: NOT given flex-col sm:flex-row like UserRow.
          The title already has min-w-0+truncate and the badge is a short,
          fixed-width chip (shrink-0) - that's the correct flex pair for a
          narrow screen (the title truncates gracefully instead of forcing
          overflow), unlike UserRow where truncating the email is itself the
          problem. Stacking here would just waste a line for no legibility
          gain. */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link href={`/jobs/${posting.id}`} target="_blank" className="font-semibold hover:text-primary truncate block">
            {posting.title}
          </Link>
          <Typography variant="small" className="text-muted-foreground">
            {posting.companyName ?? "(no company)"}
          </Typography>
          {posting.applicationUrl && (
            <a
              href={posting.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary underline break-all"
            >
              {posting.applicationUrl}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={STATUS_VARIANT[status]} className="capitalize">
            {status}
          </Badge>
        </div>
      </div>

      {posting.rejectionReason && status === "rejected" && (
        <Typography variant="small" className="text-muted-foreground">
          Reason: {posting.rejectionReason}
        </Typography>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" disabled={pending || status === "approved"} onClick={handleApprove}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending || status === "rejected"}
          onClick={() => setRejecting((v) => !v)}
        >
          Reject
        </Button>
      </div>

      {rejecting && (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Optional reason shown to the poster..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" disabled={pending} onClick={handleReject}>
              Confirm reject
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
