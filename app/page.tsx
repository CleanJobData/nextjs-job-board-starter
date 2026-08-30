import { PageContainer } from "@/components/ui/PageContainer";
import { Hero } from "@/components/landing/Hero";
import { FeatureHighlights } from "@/components/landing/FeatureHighlights";
import featuresConfig from "@/features.config";

/**
 * The marketing landing page - deliberately separate from /jobs (the
 * actual search results page, moved there from here). A template
 * consumer's homepage is the one page every visitor sees before deciding
 * to do anything, so it shouldn't be hard-coupled to the search UI - swap
 * in different sections here, or edit the copy objects at the top of
 * Hero.tsx/FeatureHighlights.tsx, without touching /jobs at all.
 */
export default function LandingPage() {
  return (
    <PageContainer size="full">
      <Hero showPostJobCta={featuresConfig.jobPosting.enabled} />
      <FeatureHighlights />
    </PageContainer>
  );
}
