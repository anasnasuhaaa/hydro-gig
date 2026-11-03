import { Navigation } from "lucide-react";
import { FeaturePage } from "@/components/shared/feature-page";

export const metadata = { title: "Navigation" };

export default function NavigationPage() {
  return (
    <FeaturePage
      title="A clearer view of the road ahead."
      description="A navigation workspace prepared for future mapping, flood warnings, and safer route alternatives."
      icon={Navigation}
      emptyTitle="No active navigation session"
      emptyDescription="No route, geographic data provider, or flood layer is connected. Interactive mapping will be enabled when a trip and suitable data are available."
      action="Start navigation"
      steps={[
        {
          title: "Select a screened trip",
          description:
            "Bring a route with traceable flood-risk information into the workspace.",
        },
        {
          title: "Review contextual warnings",
          description:
            "View future advisories alongside data freshness and provenance.",
        },
        {
          title: "Consider an alternative",
          description:
            "Compare risk-aware routes once the routing service is validated.",
        },
      ]}
    />
  );
}
