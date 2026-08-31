import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaStar } from "react-icons/fa6";
import { Badge } from "@/components/ui/Badge";
import { PageContainer } from "@/components/ui/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { getResume } from "../../actions/resumes";
import { ResumeDetailActions } from "../../components/ResumeDetailActions";
import { ResumePreview } from "../../components/ResumePreview";
import { AtsReportView } from "../../components/AtsReportView";

export default async function ResumeDetailPage({ id }: { id: string }) {
  const row = await getResume(id).catch(() => null);
  if (!row) notFound();

  return (
    <PageContainer size="full" className="space-y-6">
      <div className="space-y-4">
        <Link href="/resume" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <FaArrowLeft className="h-3 w-3" /> All resumes
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Typography variant="h1" className="text-2xl font-bold tracking-tight">
                {row.title}
              </Typography>
              {row.isDefault && (
                <Badge variant="accent" className="gap-1">
                  <FaStar className="h-2.5 w-2.5" /> Default
                </Badge>
              )}
            </div>
            <Typography variant="small" className="text-muted-foreground">
              Updated {row.updatedAt.toLocaleDateString()}
              {row.fileName ? ` - ${row.fileName}` : ""}
            </Typography>
          </div>

          <ResumeDetailActions
            id={row.id}
            title={row.title}
            fileUrl={row.fileUrl}
            isDefault={row.isDefault}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-6">
        <ResumePreview content={row.content} />
      </div>

      {row.atsReport && (
        <div className="space-y-3">
          <Typography variant="h4">ATS check</Typography>
          <AtsReportView report={row.atsReport} />
        </div>
      )}
    </PageContainer>
  );
}
