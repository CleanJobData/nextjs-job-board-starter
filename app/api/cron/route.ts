import type { NextRequest } from "next/server";
import { activeCronTasks } from "@/features/registry";
import { runTasks } from "@/lib/cron/runTasks";

/**
 * One generic, platform-agnostic cron trigger for the whole app - a plain
 * secret-header-authenticated endpoint any scheduler can hit (Vercel Cron,
 * a GitHub Actions scheduled workflow, a self-hosted crontab + curl, or
 * even node-cron if you're self-hosting on an always-on server - see
 * features/job-sync/README.md for why that's not the shipped default).
 *
 * Runs every enabled feature's registered cron tasks (features/registry.ts's
 * activeCronTasks - see features/job-sync/feature.ts for a real example),
 * strictly sequentially and isolated from each other (lib/cron/runTasks.ts):
 * several tasks across different features may hit the same third-party
 * API, so no parallelism, and one task failing doesn't block the rest.
 * Most tasks self-throttle internally (checking their own last-run
 * timestamp), so it's safe to point a scheduler at this more often than
 * any individual task actually needs to run - it'll just no-op until due.
 *
 * Adding a new scheduled task later (job alerts, email digests, etc.)
 * means registering it in that feature's feature.ts - no new route, no
 * changes here.
 */
export async function POST(req: NextRequest) {
  if (activeCronTasks.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await runTasks(activeCronTasks);
  const hasError = Object.values(results).some((r) => "error" in r);
  return Response.json({ ok: !hasError, ...results }, { status: hasError ? 500 : 200 });
}
