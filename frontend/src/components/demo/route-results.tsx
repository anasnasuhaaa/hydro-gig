"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  RoadNetwork,
  RouteResult,
  ScreenResponse,
} from "@/lib/contracts/data";
import { ProvenanceBadge } from "./shared";

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
          <p className="break-words font-mono text-sm">
            {route.node_ids.join(" → ")}
          </p>
          <p className="text-sm text-muted-foreground">
            {route.total_length_m} synthetic m · {route.total_weighted_cost}{" "}
            {route.calculation.cost_unit === "m"
              ? "distance cost (m)"
              : "demo cost units"}
          </p>
          <p className="break-words text-xs text-muted-foreground">
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
      className="space-y-5"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Route comparison · {result.request.step}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.request.scenario_id} · fictional snapshot{" "}
            {result.frame.frame.timestamp}
          </p>
        </div>
        <ProvenanceBadge />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {(
          [
            ["baseline", "Baseline · shortest distance"],
            ["demonstration_weighted", "Demonstration-weighted route"],
          ] as const
        ).map(([mode, title]) => (
          <Card key={mode} className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
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
              <p className="text-xs text-muted-foreground">
                {result.origin_to_pickup[mode].calculation.algorithm} ·{" "}
                {result.origin_to_pickup[mode].calculation.weighting_version}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle>Segment information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {segments.map((id) => {
              const edge = network.segments.find((edge) => edge.edge_id === id);
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <span>
                    <strong>{id}</strong> · {edge?.source_node} →{" "}
                    {edge?.target_node} · {edge?.length_m} synthetic m · cost{" "}
                    {result.frame.edge_costs[id]} demo units
                  </span>
                  <Badge variant="outline">
                    {result.frame.affected_edge_ids.includes(id)
                      ? "Simulated cost change"
                      : "No authored change"}
                  </Badge>
                </li>
              );
            })}
          </ul>
          <p className="text-sm font-medium">
            Scientific risk: unavailable for all segments.
          </p>
          {result.warnings.map((warning) => (
            <p key={warning} className="text-sm text-muted-foreground">
              {warning}
            </p>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
