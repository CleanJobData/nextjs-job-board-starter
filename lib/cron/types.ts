/**
 * What a feature registers into features/registry.ts's cronTasks to get
 * picked up by the one generic app/api/cron/route.ts endpoint - see that
 * route's doc comment and features/job-sync/feature.ts for a real example.
 */
export interface CronTask {
  /** Unique across the whole app - shows up in the route's response, so make it identify both the feature and the specific task (e.g. "job-sync:incremental"). */
  key: string;
  /**
   * Do the work, or decide it's not due yet - most tasks wrap their own
   * self-throttling logic (see features/job-sync/lib/sync.ts's pattern of
   * checking a stored last-run timestamp) rather than relying on the
   * runner to schedule anything; the runner just calls this and isolates
   * whatever it returns/throws from the other registered tasks.
   */
  run: () => Promise<Record<string, unknown>>;
}
