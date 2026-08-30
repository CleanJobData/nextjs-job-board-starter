import type { FeaturePlugin } from "../registry";
import { sendDueJobAlerts } from "./lib/send";

/**
 * One cron task, no nav item: /preferences is reached from the user menu /
 * a digest email's footer rather than sitting permanently in the header.
 * The task self-selects which alerts are actually due (see sendDueJobAlerts),
 * so it's safe to schedule this more often than any alert's frequency.
 */
export const jobAlertsFeature: FeaturePlugin = {
  key: "jobAlerts",
  cronTasks: () => [
    {
      key: "job-alerts:send",
      run: async () => {
        const { sent, skipped } = await sendDueJobAlerts();
        return { ok: true, detail: `sent ${sent}, skipped ${skipped}` };
      },
    },
  ],
};
