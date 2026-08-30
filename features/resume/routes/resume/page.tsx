import { PageContainer } from "@/components/ui/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { getMyResumes } from "../../actions/resumes";
import { ResumeManager, type ResumeRow } from "../../components/ResumeManager";

export default async function ResumePage() {
  const rows = await getMyResumes();

  const resumes: ResumeRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    source: r.source,
    fileUrl: r.fileUrl,
    fileName: r.fileName,
    // Only a boolean crosses to the client - rawText is the full resume
    // body and there's no reason to ship it into the browser just to
    // decide whether a "Re-parse" button renders.
    hasRawText: Boolean(r.rawText),
    isDefault: r.isDefault,
    content: r.content,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <PageContainer size="md" className="space-y-6">
      <div>
        <Typography variant="h1" className="text-3xl font-bold tracking-tight mb-1">
          Resumes
        </Typography>
        <Typography className="text-muted-foreground">
          Upload a PDF and we&apos;ll pull out the details, or build one from scratch. Everything
          we extract is editable - treat it as a starting point, not the final word.
        </Typography>
      </div>

      <ResumeManager resumes={resumes} />
    </PageContainer>
  );
}
