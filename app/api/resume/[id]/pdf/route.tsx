import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { eq, and } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { checkAccess } from "@/features/authGuard";
import { resumes } from "@/features/resume/db/schema";
import { ResumePdfDocument } from "@/features/resume/lib/pdf";

/**
 * Renders a resume's structured content to a real, downloadable PDF - the
 * "generation" half of resume that was originally scoped out of v1.
 * Works identically for "created" resumes (which have no original file at
 * all) and "uploaded" ones (rendering our structured content, not
 * re-serving the original - that already has its own /api/uploads link).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await checkAccess("resume");
  if (access.status !== "ok") {
    return NextResponse.json({ error: "Resumes are disabled or you must sign in." }, { status: 403 });
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = requireDb();
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

  const buffer = await renderToBuffer(<ResumePdfDocument content={row.content} template={row.template} />);
  const filename = `${row.title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "resume"}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
