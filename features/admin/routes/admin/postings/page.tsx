import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
import { cn } from "@/lib/utils";
import { listPostingsForAdmin } from "../../../actions/postings";
import { PostingRow } from "../../../components/PostingRow";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
] as const;

type StatusFilter = (typeof TABS)[number]["value"];

/**
 * Defaults to "pending" - that's the actionable moderation queue (see
 * AGENTS.md's phase 3 spec); approved/rejected/all are one click away via
 * the tabs below for reviewing history, but pending is what an admin lands
 * on since that's what needs their attention.
 */
export default async function AdminPostingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status: StatusFilter = TABS.some((t) => t.value === rawStatus) ? (rawStatus as StatusFilter) : "pending";

  const postings = await listPostingsForAdmin(status === "all" ? undefined : status);

  return (
    <PageContainer>
      <div className="mb-6">
        <Typography variant="h1" className="mb-2">
          Job moderation
        </Typography>
        <Typography className="text-muted-foreground">
          Self-service job postings awaiting (or having received) admin review.
        </Typography>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/postings?status=${t.value}`}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px",
              status === t.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {postings.length === 0 ? (
        <Typography className="text-muted-foreground">No postings in this view.</Typography>
      ) : (
        <div className="space-y-3">
          {postings.map((p) => (
            <PostingRow key={p.id} posting={p} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
