import { FaCircleCheck, FaTriangleExclamation, FaCircleInfo, FaCircleXmark } from "react-icons/fa6";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import type { AtsFinding, AtsRecoveredField, AtsReport, AtsSeverity } from "../lib/ats";

const SEVERITY_STYLE: Record<AtsSeverity, { icon: typeof FaCircleXmark; className: string; label: string }> = {
  critical: { icon: FaCircleXmark, className: "text-destructive", label: "Critical" },
  warning: { icon: FaTriangleExclamation, className: "text-warning", label: "Needs attention" },
  info: { icon: FaCircleInfo, className: "text-muted-foreground", label: "Worth knowing" },
};

/** Bands rather than a raw number alone - "68" means nothing without knowing whether that's good. */
function scoreBand(score: number) {
  if (score >= 85) return { label: "Strong", className: "text-primary" };
  if (score >= 60) return { label: "Needs work", className: "text-warning" };
  return { label: "At risk", className: "text-destructive" };
}

function Finding({ finding }: { finding: AtsFinding }) {
  const style = SEVERITY_STYLE[finding.severity];
  const Icon = style.icon;
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-start gap-2.5">
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", style.className)} />
        <div className="min-w-0">
          <Typography className="font-semibold">{finding.title}</Typography>
          <Typography variant="small" className={cn("font-medium", style.className)}>
            {style.label}
          </Typography>
        </div>
      </div>
      <div className="space-y-2 pl-7">
        <div>
          <Typography variant="overline">What this means</Typography>
          <Typography variant="muted" className="mt-0.5">{finding.impact}</Typography>
        </div>
        <div>
          <Typography variant="overline">How to fix it</Typography>
          <Typography variant="muted" className="mt-0.5">{finding.fix}</Typography>
        </div>
        {finding.evidence && finding.evidence.length > 0 && (
          <div>
            <Typography variant="overline">What we found</Typography>
            <ul className="mt-0.5 space-y-0.5">
              {finding.evidence.map((e, i) => (
                <li key={i} className="text-xs text-muted-foreground font-mono break-words">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The centrepiece: what a machine actually pulled out of the file.
 *
 * Deliberately framed as "check this" rather than as a verdict - no parser
 * can promise it understood a CV, so the honest thing is to show the
 * machine's reading and let the person who wrote it be the judge.
 */
function RecoveryTable({ fields }: { fields: AtsRecoveredField[] }) {
  return (
    <section className="space-y-2">
      <Typography variant="h4">Does your resume present these fields the way parsers expect?</Typography>
      <Typography variant="muted">
        These are fields most automated parsers look for in a standard place - not what one specific
        employer&apos;s ATS does, but the convention a well-built one relies on. Where the evidence
        below shows nothing found, that&apos;s about how the information is presented in your resume,
        not a guarantee of what any particular system stores.
      </Typography>
      <div className="rounded-lg border border-border divide-y divide-border">
        {fields.map((f) => (
          <div key={f.label} className="flex items-start gap-3 p-3">
            {f.ok ? (
              <FaCircleCheck className="h-3.5 w-3.5 mt-1 shrink-0 text-primary" />
            ) : (
              <FaCircleXmark className="h-3.5 w-3.5 mt-1 shrink-0 text-destructive" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Typography variant="small" className="font-semibold">
                  {f.label}
                </Typography>
                <Typography
                  variant="small"
                  className={cn("truncate", f.ok ? "text-foreground" : "text-destructive")}
                >
                  {f.value ?? "Not found"}
                </Typography>
              </div>
              <Typography variant="small" className="text-muted-foreground">
                {f.note}
              </Typography>
              {f.evidence && f.evidence.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {f.evidence.map((e, i) => (
                    <li key={i} className="text-xs text-muted-foreground font-mono break-words">
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AtsReportView({ report }: { report: AtsReport }) {
  const band = scoreBand(report.score);
  // Show the side-by-side whenever the two readings actually disagree, not
  // only for multi-column - text boxes and tables scramble order too.
  const showComparison = report.stats.columns > 1 || report.divergence > 0.25;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="flex items-baseline gap-2">
          <span className={cn("text-4xl font-bold tabular-nums", band.className)}>{report.score}</span>
          <span className="text-muted-foreground">/ 100</span>
        </div>
        <div>
          <Typography className={cn("font-semibold", band.className)}>{band.label}</Typography>
          <Typography variant="small" className="text-muted-foreground">
            {report.findings.length} issue{report.findings.length === 1 ? "" : "s"} found,{" "}
            {report.passed.length} check{report.passed.length === 1 ? "" : "s"} passed
          </Typography>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>{report.stats.pages} page{report.stats.pages === 1 ? "" : "s"}</span>
          <span>{report.stats.columns} column{report.stats.columns === 1 ? "" : "s"}</span>
          <span>{report.stats.fonts} font{report.stats.fonts === 1 ? "" : "s"}</span>
        </div>
      </div>

      <RecoveryTable fields={report.recovered} />

      {report.findings.length > 0 && (
        <section className="space-y-3">
          <Typography variant="h4">Issues to fix</Typography>
          {report.findings.map((f) => (
            <Finding key={f.id} finding={f} />
          ))}
        </section>
      )}

      {showComparison && (
        <section className="space-y-2">
          <Typography variant="h4">What different systems read</Typography>
          <Typography variant="muted">
            Same file, two parsers. The left is what a basic ATS produces by reading straight down
            the page; the right is what a layout-aware one produces. If the left looks scrambled,
            that is what a recruiter&apos;s system may have stored about you.
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Typography variant="overline">Basic parser</Typography>
              <pre className="max-h-64 overflow-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs whitespace-pre-wrap">
                {report.naiveText.slice(0, 2000)}
              </pre>
            </div>
            <div className="space-y-1">
              <Typography variant="overline">Layout-aware parser</Typography>
              <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                {report.layoutAwareText.slice(0, 2000)}
              </pre>
            </div>
          </div>
        </section>
      )}

      {report.passed.length > 0 && (
        <section className="space-y-2">
          <Typography variant="h4">Already good</Typography>
          <ul className="space-y-1.5">
            {report.passed.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <FaCircleCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <Typography variant="muted">{p}</Typography>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
