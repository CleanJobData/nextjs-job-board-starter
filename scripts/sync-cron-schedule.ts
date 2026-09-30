/**
 * Regenerates .github/workflows/cron.yml's `schedule.cron` line from
 * job-sync.config.ts, so that file is the ONLY place sync cadence is
 * defined - the workflow's schedule is a generated artifact of it, not a
 * second number a human maintains independently. Run this whenever you
 * change job-sync.config.ts's *IntervalHours fields (or just before
 * deploying) - see docs/CRON.md.
 *
 *   npx tsx scripts/sync-cron-schedule.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import jobSyncConfig from "../features/job-sync/job-sync.config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOW_PATH = join(__dirname, "..", ".github", "workflows", "cron.yml");

// The scheduler only needs to fire often enough that the FASTEST
// registered task's own self-throttle is what actually gates it - firing
// any less often than that would mean that task can never hit its
// configured interval. GitHub Actions schedules aren't reliable below
// ~5 minutes, so that's the floor regardless of how aggressive the
// config gets.
const intervalsHours = [
  jobSyncConfig.incrementalSyncIntervalHours,
  jobSyncConfig.expiredCheckIntervalHours,
  jobSyncConfig.companyRefreshIntervalHours,
];
const minHours = Math.min(...intervalsHours);
const minMinutes = Math.max(5, Math.round(minHours * 60));

function cronForHours(hours: number): string {
  if (hours === 1) return "0 * * * *";
  if (Number.isInteger(hours)) return `0 */${hours} * * *`;
  return `*/${Math.round(hours * 60)} * * * *`; // non-whole-hour interval - fall back to minute-granularity
}

const cronExpr = minMinutes < 60 ? `*/${minMinutes} * * * *` : cronForHours(minMinutes / 60);

const workflow = readFileSync(WORKFLOW_PATH, "utf8");
const updated = workflow.replace(
  /(-\s*cron:\s*")[^"]*(")/,
  `$1${cronExpr}$2`
);

if (updated === workflow && !workflow.includes(cronExpr)) {
  throw new Error(`Could not find a "- cron: \"...\"" line to update in ${WORKFLOW_PATH}`);
}

writeFileSync(WORKFLOW_PATH, updated);
console.log(`.github/workflows/cron.yml schedule set to "${cronExpr}" (from the fastest configured interval, ${minHours}h).`);
