import { ShieldCheck } from "lucide-react";
import { FeaturePage } from "@/components/shared/feature-page";

export const metadata = { title: "Evidence & claims" };

export default function Claims() {
  return (
    <FeaturePage
      title="Keep the context. Protect your journey."
      description="A planned home for verifiable flood-incident evidence and driver claim records."
      icon={ShieldCheck}
      emptyTitle="No claim records are available"
      emptyDescription="Claim storage and cryptographic evidence generation have not been enabled. No incident records or tokens have been created."
      action="Create evidence token"
      steps={[
        {
          title: "Document the incident",
          description:
            "Associate a trip, location, time, and relevant flood evidence.",
        },
        {
          title: "Create verifiable evidence",
          description:
            "Produce a signed record with explicit provenance after verification is implemented.",
        },
        {
          title: "Support a claim",
          description:
            "Export evidence for review. Acceptance by a ride-hailing platform is not guaranteed.",
        },
      ]}
    />
  );
}
