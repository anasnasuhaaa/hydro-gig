import { Route } from "lucide-react";
import { FeaturePage } from "@/components/shared/feature-page";

export const metadata = { title: "Pre-order screening" };

export default function PreOrder() {
  return (
    <FeaturePage
      title="Know the route before the ride."
      description="A future workspace to screen pickup and destination routes before accepting an order."
      icon={Route}
      emptyTitle="Route screening is being prepared"
      emptyDescription="Route inputs and flood exposure assessments will appear once the risk engine and verified data providers are integrated."
      action="Screen a route"
      steps={[
        {
          title: "Set pickup and destination",
          description:
            "Identify the proposed journey and available road segments.",
        },
        {
          title: "Review flood exposure",
          description:
            "Inspect time-stamped risk information with its source and uncertainty.",
        },
        {
          title: "Make an informed choice",
          description:
            "Compare alternatives when sufficient evidence is available.",
        },
      ]}
    />
  );
}
