import type { CronTask } from "./types";

/**
 * Runs every given task strictly sequentially, never in parallel - several
 * cron tasks across different features may all hit the same third-party
 * API (CleanJobData, an email provider, etc.), and running them
 * concurrently would multiply the request burst against whatever rate
 * limits apply, for no benefit. Each task is isolated from the others: one
 * throwing doesn't stop the rest from getting their turn in this run.
 */
export async function runTasks(tasks: CronTask[]) {
  const results: Record<string, Record<string, unknown>> = {};

  for (const task of tasks) {
    try {
      results[task.key] = await task.run();
    } catch (error) {
      results[task.key] = { ran: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  return results;
}
