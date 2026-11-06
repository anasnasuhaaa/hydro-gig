"use client";
import { useId, useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Flag, Navigation2, UserRound } from "lucide-react";
import { networkGeometry, orderedJourney } from "./network-geometry";
import { type z } from "zod";
import { type networkSchema, type FixtureResult } from "@/lib/api/experimental";
import { Button } from "@/components/ui/button";
import { DemoSelect } from "@/components/demo/shared";
import { type RouteMode } from "./route-comparison";

export function ExperimentalNetwork({
  graph,
  result,
  selected,
}: {
  graph: z.infer<typeof networkSchema>;
  result: FixtureResult;
  selected: RouteMode;
}) {
  const t = useTranslations("Experimental");
  const locale = useLocale();
  const id = useId().replaceAll(":", "");
  const [inspected, setInspected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const selectRef = useRef<HTMLButtonElement>(null);
  const clear = () => {
    setInspected(null);
    setHovered(null);
    selectRef.current?.focus();
  };
  const edgeId = inspected ?? "";
  const edges = useMemo(
    () => new Map(graph.edges.map((e) => [e.edge_id, e])),
    [graph],
  );
  const edge = edges.get(edgeId);
  const sample = result.frame.samples[edgeId];
  const { points, paths, viewBox } = useMemo(
    () => networkGeometry(graph),
    [graph],
  );
  const journeys = {
    baseline: orderedJourney(graph, result, "baseline"),
    weighted: orderedJourney(graph, result, "weighted"),
  };
  const baseline = new Set(journeys.baseline.flatMap((leg) => leg.edgeIds));
  const weighted = new Set(journeys.weighted.flatMap((leg) => leg.edgeIds));
  const activeIds = new Set(journeys[selected].flatMap((leg) => leg.edgeIds));
  const alternativeIds = selected === "weighted" ? baseline : weighted;
  const orderedIds = [
    ...new Set([
      ...graph.edges
        .filter((e) => !activeIds.has(e.edge_id))
        .map((e) => e.edge_id),
      ...journeys[selected].flatMap((leg) => leg.edgeIds),
    ]),
  ];
  const stops = [
    { role: "origin", label: "stopStart", Icon: Navigation2 },
    { role: "pickup", label: "stopPickup", Icon: UserRound },
    { role: "destination", label: "stopDestination", Icon: Flag },
  ] as const;
  const changed = new Set(result.frame.changed_edge_ids);
  const hoverPath = hovered ? paths.get(hovered) : undefined;
  const number = (v: number | null | undefined) =>
    v == null
      ? t("unknown")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(v);
  return (
    <div
      className="space-y-3"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setInspected(null);
          setHovered(null);
        }
      }}
    >
      <ol
        className="grid grid-cols-3 gap-2 border-b pb-3"
        aria-label={t("tripStops")}
      >
        {stops.map(({ role, label, Icon }, index) => (
          <li key={role} data-stop-summary={role} className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold sm:text-sm">
              <Icon
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
              <span>{t(label)}</span>
            </div>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              <span aria-hidden="true">{index + 1} · </span>
              {result.request[role]}
            </p>
          </li>
        ))}
      </ol>
      <div className="network-surface relative rounded-xl border">
        <svg
          viewBox={viewBox}
          role="img"
          aria-label={t("preview")}
          aria-describedby={`${id}-help`}
          className="route-canvas block w-full"
          data-frame={result.frame.step}
          data-selected-route={selected}
        >
          <desc>
            {stops
              .map(({ role, label }) => `${t(label)}: ${result.request[role]}`)
              .join(" → ")}
          </desc>
          {orderedIds.map((edgeId) => {
            const geometry = paths.get(edgeId)!;
            const isSelected = activeIds.has(edgeId);
            const isAlternative = !isSelected && alternativeIds.has(edgeId);
            const active = inspected === edgeId || hovered === edgeId;
            const color = isSelected
              ? selected === "weighted"
                ? "var(--primary)"
                : "var(--route-baseline)"
              : isAlternative
                ? selected === "weighted"
                  ? "var(--route-baseline)"
                  : "var(--primary)"
                : "var(--edge-unrelated)";
            return (
              <g
                key={edgeId}
                data-edge-id={edgeId}
                data-changed={changed.has(edgeId)}
                data-on-route={isSelected}
                data-alternative={isAlternative}
                data-shared={baseline.has(edgeId) && weighted.has(edgeId)}
                data-inspected={inspected === edgeId}
                data-legs={journeys[selected]
                  .filter((leg) => leg.edgeIds.includes(edgeId))
                  .map((leg) => leg.leg)
                  .join(" ")}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setHovered(edgeId);
                }}
                onPointerLeave={() => setHovered(null)}
                onClick={() => setInspected(edgeId)}
                className="cursor-pointer"
              >
                <title>{t("inspectNamed", { edge: edgeId })}</title>
                {active && (
                  <path
                    d={geometry.d}
                    fill="none"
                    stroke="var(--foreground)"
                    strokeWidth="13"
                    opacity="0.18"
                  />
                )}
                <path
                  data-edge-stroke
                  d={geometry.d}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 5 : isAlternative ? 2.5 : 1.5}
                  strokeDasharray={isAlternative ? "6 6" : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isSelected ? 1 : isAlternative ? 0.8 : 0.3}
                />
                {geometry.length > 30 && (
                  <path
                    d="M -3 -3 L 1 0 L -3 3"
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? 2 : 1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform={`translate(${geometry.mid.x} ${geometry.mid.y}) rotate(${geometry.angle})`}
                    opacity={isSelected || isAlternative ? 1 : 0.5}
                  />
                )}
                {changed.has(edgeId) && (
                  <circle
                    cx={geometry.mid.x}
                    cy={geometry.mid.y}
                    r={isSelected ? 3.5 : 2.5}
                    fill="var(--edge-change)"
                    stroke="var(--card)"
                    strokeWidth="1.5"
                  />
                )}
                <path
                  data-edge-hit
                  d={geometry.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                />
              </g>
            );
          })}
          {graph.nodes.map((node) => {
            const p = points.get(node.node_id)!;
            const roles = stops.filter(
              ({ role }) => result.request[role] === node.node_id,
            );
            return (
              <g key={node.node_id} className="pointer-events-none">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={roles.length ? 15 : 3.5}
                  fill="var(--card)"
                  stroke={
                    roles.length ? "var(--foreground)" : "var(--edge-unrelated)"
                  }
                  strokeWidth={roles.length ? 2 : 1.5}
                />
                {roles.map(({ role, label, Icon }, index) => (
                  <g
                    key={role}
                    data-stop-role={role}
                    data-node-id={node.node_id}
                    transform={`translate(${p.x} ${p.y})`}
                  >
                    <Icon
                      x={-9 + index * 20}
                      y={-9}
                      width={18}
                      height={18}
                      stroke="var(--foreground)"
                    />
                    <text
                      x="0"
                      y={-24 - index * 24}
                      textAnchor="middle"
                      fontSize="17"
                      fontWeight="650"
                      fill="var(--foreground)"
                      stroke="var(--background)"
                      strokeWidth="5"
                      paintOrder="stroke"
                    >
                      {t(label)}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
        {hovered && hoverPath && (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)] rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
          >
            <p className="break-all font-semibold">{hovered}</p>
            <p>
              {t("weight")}: {number(result.frame.samples[hovered]?.weight)}
            </p>
          </div>
        )}
      </div>
      <ul
        className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
        aria-label={t("networkLegend")}
      >
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`w-5 border-t-[3px] ${selected === "weighted" ? "border-primary" : "border-route-baseline"}`}
          />
          {t("selectedLegend")}
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`w-5 border-t-2 border-dashed ${selected === "weighted" ? "border-route-baseline" : "border-primary"}`}
          />
          {t("alternativeLegend")}
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-[var(--edge-change)]"
          />
          {t("changedValueLegend")}
        </li>
      </ul>
      <div className="rounded-xl border p-3">
        <DemoSelect
          id={`${id}-edge`}
          label={t("inspect")}
          inputRef={selectRef}
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
            <Button variant="ghost" className="min-h-11" onClick={clear}>
              {t("clearSelection")}
            </Button>
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
