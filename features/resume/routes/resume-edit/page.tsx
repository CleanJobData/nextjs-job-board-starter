import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { PageContainer } from "@/components/ui/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { getResume } from "../../actions/resumes";
import { ResumeEditor } from "../../components/ResumeEditor";

export default async function ResumeEditPage({ id }: { id: string }) {
  const row = await getResume(id).catch(() => null);
  if (!row) notFound();

  return (
    <PageContainer size="full" className="space-y-6">
      <div className="space-y-1">
        <Link href={`/resume/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <FaArrowLeft className="h-3 w-3" /> Back to {row.title}
        </Link>
        <Typography variant="h1" className="text-2xl font-bold tracking-tight">
          Edit resume
        </Typography>
      </div>

      <ResumeEditor id={row.id} initialTitle={row.title} initialContent={row.content} />
    </PageContainer>
  );
}
