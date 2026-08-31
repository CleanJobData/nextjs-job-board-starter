import { notFound, redirect } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { auth } from "@/features/auth/lib/auth";
import featuresConfig from "@/features.config";
import { PreferencesEditor } from "@/features/onboarding/components/PreferencesEditor";
import type { PreferenceDraft } from "@/features/onboarding/components/PreferenceFields";
import { getMySettings } from "../../actions/alerts";
import { AlertSettings } from "../../components/AlertSettings";

export default async function PreferencesPage() {
  if (!featuresConfig.jobAlerts.enabled) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const settings = await getMySettings();
  const prefs = settings?.prefs;

  const initial: PreferenceDraft = {
    titles: prefs?.titles.join(", ") ?? "",
    locations: prefs?.locations ?? [],
    remoteOnly: prefs?.remoteOnly ?? false,
    levels: prefs?.experienceLevels ?? [],
    minSalary: prefs?.minSalary != null ? String(prefs.minSalary) : "",
  };

  return (
    <PageContainer size="full" className="space-y-6">
      <div>
        <Typography variant="h1" className="text-3xl font-bold tracking-tight mb-1">
          Preferences
        </Typography>
        <Typography className="text-muted-foreground">
          These shape your job feed and any alerts you receive.
        </Typography>
      </div>

      <PreferencesEditor initial={initial} />

      <AlertSettings
        initialEnabled={settings?.alert?.enabled ?? false}
        initialFrequency={settings?.alert?.frequency ?? "weekly"}
      />
    </PageContainer>
  );
}
