"use client";
import { useId, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { type z } from "zod";
import { type networkSchema, type FixtureResult } from "@/lib/api/experimental";
import { DemoSelect } from "@/components/demo/shared";
import { type RouteMode } from "./route-comparison";

export function ExperimentalNetwork({
  graph,
  baseline,
  weighted,
  result,
  selected,
}: {
  graph: z.infer<typeof networkSchema>;
  baseline: Set<string>;
  weighted: Set<string>;
  result: FixtureResult;
  selected: RouteMode;
}) {
  const t = useTranslations("Experimental");
  const locale = useLocale();
  const id = useId().replaceAll(":", "");
  const [inspected, setInspected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const edgeId =
    hovered ??
    inspected ??
    [...(selected === "weighted" ? weighted : baseline)][0] ??
    graph.edges[0]?.edge_id;
  const edge = graph.edges.find((e) => e.edge_id === edgeId);
  const sample = result.frame.samples[edgeId];
  const xs = graph.nodes.map((n) => n.x),
    ys = graph.nodes.map((n) => n.y);
  const minX = Math.min(...xs),
    minY = Math.min(...ys),
    dx = Math.max(...xs) - minX || 1,
    dy = Math.max(...ys) - minY || 1;
  const points = Object.fromEntries(
    graph.nodes.map((n) => [
      n.node_id,
      { x: 38 + (400 * (n.x - minX)) / dx, y: 400 - (350 * (n.y - minY)) / dy },
    ]),
  );
  const number = (v: number | null | undefined) =>
    v == null
      ? t("unknown")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(v);
  return (
    <div className="space-y-4">
      <div className="network-surface rounded-xl border p-1">
        <svg
          viewBox="0 0 480 440"
          role="img"
          aria-label={t("preview")}
          aria-describedby={`${id}-help`}
          className="mx-auto w-full max-w-[680px]"
          data-frame={result.frame.step}
          data-selected-route={selected}
        >
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
            </marker>
          </defs>
          {graph.edges.map((e) => {
            const a = points[e.source_node],
              b = points[e.target_node];
            const reciprocal = graph.edges.some(
              (other) =>
                other.source_node === e.target_node &&
                other.target_node === e.source_node,
            );
            const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const ox = reciprocal ? (-(b.y - a.y) / length) * 12 : 0,
              oy = reciprocal ? ((b.x - a.x) / length) * 12 : 0;
            const line = {
              x1: a.x + ox,
              y1: a.y + oy,
              x2: b.x + ox,
              y2: b.y + oy,
            };
            const isChanged = result.frame.changed_edge_ids.includes(e.edge_id);
            const isSelected = (
              selected === "weighted" ? weighted : baseline
            ).has(e.edge_id);
            const active = edgeId === e.edge_id;
            return (
              <g
                key={e.edge_id}
                data-edge-id={e.edge_id}
                data-changed={isChanged}
                data-on-route={isSelected}
                data-inspected={active}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setHovered(e.edge_id);
                }}
                onPointerLeave={() => setHovered(null)}
                onClick={() => setInspected(e.edge_id)}
                className="cursor-pointer"
              >
                <title>{t("inspectNamed", { edge: e.edge_id })}</title>
                {isChanged && (
                  <line
                    {...line}
                    stroke="var(--edge-change)"
                    strokeWidth="12"
                    strokeDasharray="2 6"
                    opacity="0.7"
                  />
                )}
                {active && (
                  <line
                    {...line}
                    stroke="var(--foreground)"
                    strokeWidth="10"
                    opacity="0.5"
                  />
                )}
                <line
                  {...line}
                  stroke="var(--edge-unrelated)"
                  strokeWidth="2"
                  markerEnd={`url(#${id}-arrow)`}
                />
                {baseline.has(e.edge_id) && (
                  <line
                    {...line}
                    stroke="var(--route-baseline)"
                    strokeWidth={selected === "baseline" ? 6 : 3}
                    opacity={selected === "baseline" ? 1 : 0.6}
                    markerEnd={`url(#${id}-arrow)`}
                  />
                )}
                {weighted.has(e.edge_id) && (
                  <line
                    {...line}
                    stroke="var(--primary)"
                    strokeWidth={selected === "weighted" ? 5 : 3}
                    strokeDasharray="9 5"
                    opacity={selected === "weighted" ? 1 : 0.6}
                    markerEnd={`url(#${id}-arrow)`}
                  />
                )}
                <line {...line} stroke="transparent" strokeWidth="20" />
              </g>
            );
          })}
          {graph.nodes.map((n) => {
            const p = points[n.node_id];
            const stop = [
              result.request.origin,
              result.request.pickup,
              result.request.destination,
            ].includes(n.node_id);
            return (
              <g key={n.node_id} className="pointer-events-none">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={stop ? 9 : 5}
                  fill={stop ? "var(--primary)" : "var(--card)"}
                  stroke={stop ? "var(--card)" : "var(--edge-unrelated)"}
                  strokeWidth="3"
                />
                <text
                  x={p.x}
                  y={p.y - 16}
                  textAnchor="middle"
                  fontSize="15"
                  fontWeight={stop ? 700 : 500}
                  fill="var(--foreground)"
                  stroke="var(--card)"
                  strokeWidth="4"
                  paintOrder="stroke"
                >
                  {n.node_id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul
        className="grid grid-cols-2 gap-3 text-xs text-muted-foreground"
        aria-label={t("networkLegend")}
      >
        {(
          ["baseline", "weighted", "changedLegend", "inspectedLegend"] as const
        ).map((key, index) => (
          <li key={key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`w-6 shrink-0 border-t-[3px] ${index === 0 ? "border-route-baseline" : index === 1 ? "border-primary border-dashed" : index === 2 ? "border-[var(--edge-change)] border-dotted" : "border-foreground"}`}
            />
            {t(key)}
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-muted/60 p-4">
        <DemoSelect
          id={`${id}-edge`}
          label={t("inspect")}
          value={edgeId}
          onChange={setInspected}
          options={graph.edges.map((e) => ({
            value: e.edge_id,
            label: `${e.edge_id} · ${e.source_node} → ${e.target_node}`,
          }))}
        />
        <p id={`${id}-help`} className="my-3 text-xs text-muted-foreground">
          {t("inspectHelp")}
        </p>
        {edge && (
          <div
            data-testid="edge-inspector"
            aria-live="polite"
            className="space-y-3"
          >
            <p className="text-sm font-semibold">
              {edge.edge_id}{" "}
              <span className="font-normal text-muted-foreground">
                · {edge.source_node} → {edge.target_node}
              </span>
            </p>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ["h_m", sample?.h_m],
                ["u_ms", sample?.u_ms],
                ["v_ms", sample?.v_ms],
                ["weight", sample?.weight],
                [
                  "delta",
                  result.frame.previous_step === null
                    ? null
                    : result.frame.weight_deltas[edgeId],
                ],
                ["segmentDistance", edge.length_m],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">
                    {t(label as string)}
                  </dt>
                  <dd className="mt-1 font-medium tabular-nums">
                    {number(value as number | null | undefined)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("unitsCaveat")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
