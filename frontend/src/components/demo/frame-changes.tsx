"use client";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { demoApi } from "@/lib/api/demo";
import type { ScreenRequest, ScreenResponse } from "@/lib/contracts/data";

/** Compare the actual API snapshots, even when a user jumps directly to the last frame. */
export function FrameChanges({
  result,
  previousRequest,
}: {
  result: ScreenResponse;
  previousRequest: ScreenRequest | null;
}) {
  const t = useTranslations("Navigation");
  const timeline = useTranslations("Timeline");
  const previous = useQuery({
    queryKey: ["demo-screen", previousRequest],
    queryFn: ({ signal }) => demoApi.screen(previousRequest!, signal),
    enabled: !!previousRequest,
    retry: false,
  });
  const before =
    !previous.isFetching && !previous.error ? previous.data : undefined;
  const increased = before
    ? Object.keys(result.frame.edge_costs).filter(
        (id) => result.frame.edge_costs[id] > before.frame.edge_costs[id],
      )
    : [];
  const decreased = before
    ? Object.keys(result.frame.edge_costs).filter(
        (id) => result.frame.edge_costs[id] < before.frame.edge_costs[id],
      )
    : [];
  const unavailable = [
    result.origin_to_pickup,
    result.pickup_to_destination,
  ].some((leg) => leg.demonstration_weighted.status === "unreachable");
  return (
    <Alert
      className="min-w-0 border-risk-moderate/30 bg-risk-moderate/5 p-4"
      role="status"
    >
      <AlertTriangle className="text-risk-moderate" />
      <AlertTitle>
        {t("warning", { step: timeline(result.request.step) })}
      </AlertTitle>
      <AlertDescription className="space-y-3 [&_p:not(:last-child)]:mb-0">
        {!previousRequest ? (
          <p>{t("initial")}</p>
        ) : previous.error ? (
          <div>
            <p>{t("comparisonUnavailable")}</p>
            <Button
              variant="outline"
              className="mt-2 min-h-11"
              onClick={() => void previous.refetch()}
            >
              {t("retryComparison")}
            </Button>
          </div>
        ) : !before ? (
          <p>{t("comparing")}</p>
        ) : (
          <>
            <p>{t("since", { step: timeline(before.request.step) })}</p>
            {increased.length > 0 && (
              <p>{t("increased", { edges: increased.join(", ") })}</p>
            )}
            {decreased.length > 0 && (
              <p>{t("decreased", { edges: decreased.join(", ") })}</p>
            )}
            {!increased.length && !decreased.length && (
              <p>{t("noCostChanges")}</p>
            )}
            {(["origin_to_pickup", "pickup_to_destination"] as const).map(
              (leg, index) => {
                const oldRoute = before[leg].demonstration_weighted;
                const route = result[leg].demonstration_weighted;
                const path = route.node_ids.join(" → ");
                const oldPath = oldRoute.node_ids.join(" → ");
                return (
                  <p key={leg}>
                    <strong>
                      {t(index === 0 ? "firstLeg" : "secondLeg")}:{" "}
                    </strong>
                    {route.status === "unreachable"
                      ? t("legUnavailable")
                      : path === oldPath
                        ? t("sameRoute", { path })
                        : t("newRoute", {
                            path,
                            previous: oldPath || t("legUnavailable"),
                          })}
                  </p>
                );
              },
            )}
          </>
        )}
        {unavailable && <p className="font-medium">{t("incomplete")}</p>}
        <p>{t("costBoundary")}</p>
      </AlertDescription>
    </Alert>
  );
}
