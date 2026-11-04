"use client";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  RoadNetwork,
  RouteResult,
  ScreenResponse,
} from "@/lib/contracts/data";

function Leg({ title, route }: { title: string; route: RouteResult }) {
  return (
    <div className="space-y-2 border-t pt-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      {route.status === "unreachable" ? (
        <p className="text-sm text-muted-foreground">
          Route unavailable — no directed path connects these nodes.
        </p>
      ) : (
        <>
          <p className="break-words font-mono text-base">
            {route.node_ids.join(" → ")}
          </p>
          <p className="text-sm text-muted-foreground">
            {route.total_length_m} synthetic m
            {route.calculation.cost_unit === "demo_cost_units"
              ? ` · ${route.total_weighted_cost} demo cost units`
              : ""}
          </p>
          <p className="break-words text-sm text-muted-foreground">
            Segments: {route.edge_ids.join(", ")}
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
    <section
      aria-label="Screening results"
      className="space-y-4"
      aria-live="polite"
    >
      <div>
        <h2 className="text-xl font-semibold">
          Route comparison · {result.request.step}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fictional snapshot ·{" "}
          <time dateTime={result.frame.frame.timestamp}>
            {new Date(result.frame.frame.timestamp).toUTCString()}
          </time>
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(
          [
            ["baseline", "Distance baseline"],
            ["demonstration_weighted", "Demo-weighted route"],
          ] as const
        ).map(([mode, title]) => (
          <Card
            key={mode}
            className={`min-w-0 shadow-none ${mode === "demonstration_weighted" ? "ring-primary/30" : ""}`}
          >
            <CardHeader>
              <CardTitle>
                <h3>{title}</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Leg
                title="Origin → pickup"
                route={result.origin_to_pickup[mode]}
              />
              <Leg
                title="Pickup → destination"
                route={result.pickup_to_destination[mode]}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm font-medium">
        Scientific risk: unavailable for all segments.
      </p>
      <details className="group min-w-0 rounded-xl border bg-card">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          Segment and calculation details
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t p-4 text-sm">
          <p className="break-words text-muted-foreground">
            Scenario: {result.request.scenario_id}
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
                      {edge?.target_node} · {edge?.length_m} synthetic m ·{" "}
                      {result.frame.edge_costs[id]} demo cost units
                    </span>
                    <Badge variant="outline" className="text-sm">
                      {result.frame.affected_edge_ids.includes(id)
                        ? "Simulated cost change"
                        : "No authored change"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No route segments are available.</p>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["baseline", "Distance baseline"],
                ["demonstration_weighted", "Demo-weighted route"],
              ] as const
            ).map(([mode, title]) => (
              <div key={mode}>
                <dt className="font-medium">{title}</dt>
                <dd className="break-words text-muted-foreground">
                  {result.origin_to_pickup[mode].calculation.algorithm} ·{" "}
                  {result.origin_to_pickup[mode].calculation.weighting_version}
                </dd>
              </div>
            ))}
          </dl>
          {result.warnings.map((warning) => (
            <p key={warning} className="text-muted-foreground">
              {warning}
            </p>
          ))}
        </div>
      </details>
    </section>
  );
}
