"use client";
import { useTranslations, useFormatter } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  RoadNetwork,
  RouteResult,
  ScreenResponse,
} from "@/lib/contracts/data";

function Leg({ title, route }: { title: string; route: RouteResult }) {
  const t = useTranslations("Results");
  const format = useFormatter();
  return (
    <div className="space-y-2 border-t pt-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      {route.status === "unreachable" ? (
        <p className="text-sm text-muted-foreground">{t("unavailable")}</p>
      ) : (
        <>
          <p className="break-words font-mono text-base">
            {route.node_ids.join(" → ")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("length", { value: format.number(route.total_length_m!) })}
            {route.calculation.cost_unit === "demo_cost_units"
              ? t("cost", { value: format.number(route.total_weighted_cost!) })
              : ""}
          </p>
          <p className="break-words text-sm text-muted-foreground">
            {t("segments")} {route.edge_ids.join(", ")}
          </p>
        </>
      )}
    </div>
  );
}

export function RouteResults({
  result,
  network,
}: {
  result: ScreenResponse;
  network: RoadNetwork;
}) {
  const t = useTranslations("Results");
  const timeline = useTranslations("Timeline");
  const format = useFormatter();
  const weighted = [
    ...result.origin_to_pickup.demonstration_weighted.edge_ids,
    ...result.pickup_to_destination.demonstration_weighted.edge_ids,
  ];
  const baseline = [
    ...result.origin_to_pickup.baseline.edge_ids,
    ...result.pickup_to_destination.baseline.edge_ids,
  ];
  const segments = [...new Set([...baseline, ...weighted])];
  return (
    <section aria-label={t("results")} className="space-y-4" aria-live="polite">
      <div>
        <h2 className="text-xl font-semibold">
          {t("comparison", { step: timeline(result.request.step) })}
        </h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(
          [
            ["baseline", t("baseline")],
            ["demonstration_weighted", t("weighted")],
          ] as const
        ).map(([mode, title]) => (
          <Card
            key={mode}
            className={`min-w-0 shadow-sm ${mode === "demonstration_weighted" ? "border-primary/40 bg-accent/20 ring-primary/20" : "border-route-baseline/30"}`}
          >
            <CardHeader>
              <CardTitle>
                <h3
                  className={
                    mode === "demonstration_weighted"
                      ? "text-primary"
                      : "text-route-baseline"
                  }
                >
                  {title}
                </h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge
                variant="secondary"
                className="h-auto min-h-7 whitespace-normal text-sm"
              >
                {t("affectedCount", {
                  count: new Set(
                    [
                      ...result.origin_to_pickup[mode].edge_ids,
                      ...result.pickup_to_destination[mode].edge_ids,
                    ].filter((id) =>
                      result.frame.affected_edge_ids.includes(id),
                    ),
                  ).size,
                })}
              </Badge>
              <Leg title={t("first")} route={result.origin_to_pickup[mode]} />
              <Leg
                title={t("second")}
                route={result.pickup_to_destination[mode]}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm font-medium">{t("risk")}</p>
      <details className="group min-w-0 rounded-xl border bg-card">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          {t("details")}
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t p-4 text-sm">
          <p className="text-sm text-muted-foreground">
            {t("snapshot")}{" "}
            <time dateTime={result.frame.frame.timestamp}>
              {format.dateTime(new Date(result.frame.frame.timestamp), {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </p>
          <p>
            {t("frame")}: {result.request.step} · {t("provenance")}
          </p>
          <p>
            {t("network")}: {result.network_id}
          </p>
          <p className="break-words text-muted-foreground">
            {t("scenario")} {result.request.scenario_id}
          </p>
          {segments.length ? (
            <ul className="space-y-2">
              {segments.map((id) => {
                const edge = network.segments.find(
                  (edge) => edge.edge_id === id,
                );
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-3"
                  >
                    <span>
                      <strong>{id}</strong> · {edge?.source_node} →{" "}
                      {edge?.target_node} ·{" "}
                      {t("length", {
                        value: format.number(edge?.length_m ?? 0),
                      })}{" "}
                      ·{" "}
                      {t("cost", {
                        value: format.number(result.frame.edge_costs[id]),
                      })}
                    </span>
                    <Badge variant="outline" className="text-sm">
                      {result.frame.affected_edge_ids.includes(id)
                        ? t("change")
                        : t("unchanged")}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>{t("empty")}</p>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["baseline", t("baseline")],
                ["demonstration_weighted", t("weighted")],
              ] as const
            ).map(([mode, title]) => (
              <div key={mode}>
                <dt className="font-medium">{title}</dt>
                <dd className="break-words text-muted-foreground">
                  {result.origin_to_pickup[mode].calculation.algorithm} ·{" "}
                  {result.origin_to_pickup[mode].calculation.engine_version} ·{" "}
                  {result.origin_to_pickup[mode].calculation.weighting_version}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-muted-foreground">{t("limits")}</p>
        </div>
      </details>
    </section>
  );
}
