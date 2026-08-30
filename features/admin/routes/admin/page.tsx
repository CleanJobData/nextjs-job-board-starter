import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";

const SECTIONS = [
  { href: "/admin/postings", label: "Job moderation", description: "Approve or reject self-service job postings." },
  { href: "/admin/users", label: "Users", description: "View users and change roles." },
  { href: "/admin/sync", label: "Sync status", description: "Job-sync run history and due status per kind." },
  { href: "/admin/alerts", label: "Job alerts", description: "Who receives digest emails, and how often." },
];

/** Landing page for the /admin route group - three distinct sections, each with its own real data table, so they're separate routes rather than tabs on one page (see AGENTS.md's phase 3 spec). */
export default function AdminHomePage() {
  return (
    <PageContainer size="full">
      <Typography variant="h1" className="mb-8">
        Admin
      </Typography>
      <div className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="p-5 h-full hover:border-primary transition-colors">
              <Typography className="font-semibold mb-1">{s.label}</Typography>
              <Typography variant="small" className="text-muted-foreground">
                {s.description}
              </Typography>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
