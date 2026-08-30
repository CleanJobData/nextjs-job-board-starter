import { Typography } from "@/components/ui/Typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { FaCircleCheck, FaCircleXmark, FaCircleInfo } from "react-icons/fa6";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const envVars = [
    {
      name: "CLEANJOBDATA_API_URL",
      value: process.env.CLEANJOBDATA_API_URL,
      required: true,
      description: "The base URL for the CleanJobData API.",
    },
    {
      name: "CLEANJOBDATA_API_KEY",
      value: process.env.CLEANJOBDATA_API_KEY,
      required: true,
      description: "Your secret API key from the CleanJobData dashboard.",
      isSecret: true,
    },
    {
      name: "NEXT_PUBLIC_SITE_NAME",
      value: process.env.NEXT_PUBLIC_SITE_NAME,
      required: true,
      description: "The name of your job board displayed in the header and metadata.",
    },
    {
      name: "NEXT_PUBLIC_APP_URL",
      value: process.env.NEXT_PUBLIC_APP_URL,
      required: false,
      description: "The production URL of your site (used for SEO and OG images).",
    },
  ];

  const allRequiredPresent = envVars
    .filter((v) => v.required)
    .every((v) => !!v.value);

  return (
    <PageContainer size="full">
      <div className="mb-8 text-center">
        <Typography variant="h1" className="mb-2">Setup Status</Typography>
        <Typography className="text-muted-foreground">
          Check the health of your environment configuration.
        </Typography>
      </div>

      <div className="grid gap-6">
        <Card className={allRequiredPresent ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"}>
          <CardHeader className="flex flex-row items-center gap-4">
            {allRequiredPresent ? (
              <FaCircleCheck className="h-8 w-8 text-primary" />
            ) : (
              <FaCircleXmark className="h-8 w-8 text-destructive" />
            )}
            <div>
              <CardTitle>
                {allRequiredPresent ? "Configuration Ready" : "Configuration Incomplete"}
              </CardTitle>
              <Typography variant="small" className="text-muted-foreground">
                {allRequiredPresent 
                  ? "All required environment variables are set correctly." 
                  : "Some required environment variables are missing."}
              </Typography>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4">
          {envVars.map((v) => (
            <Card key={v.name} className="overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Typography className="font-mono font-bold">{v.name}</Typography>
                    {v.required && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Required
                      </span>
                    )}
                  </div>
                  <Typography variant="small" className="text-muted-foreground mb-2">
                    {v.description}
                  </Typography>
                  <div className="flex items-center gap-2">
                    {v.value ? (
                      <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                        <FaCircleCheck className="h-4 w-4" />
                        <span>
                          {v.isSecret ? "••••••••••••" : v.value}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-destructive text-sm font-medium">
                        <FaCircleXmark className="h-4 w-4" />
                        <span>Missing</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {!allRequiredPresent && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex gap-3">
            <FaCircleInfo className="h-5 w-5 text-warning shrink-0" />
            <div className="text-sm text-warning-foreground">
              <p className="font-bold text-warning mb-1">Action Required</p>
              <p>
                Please add the missing environment variables to your hosting provider's dashboard or your local <code>.env.local</code> file and restart the server.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
