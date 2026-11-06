"use client";
import { useId, useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Flag, Navigation2, UserRound, X } from "lucide-react";
import {
  networkGeometry,
  orderedJourney,
  stopLabels,
} from "./network-geometry";
import { type z } from "zod";
import { type networkSchema, type FixtureResult } from "@/lib/api/experimental";
import { Button } from "@/components/ui/button";
import { DemoSelect } from "@/components/demo/shared";
import { Disclosure } from "@/components/ui/disclosure";
import { type PointerEvent } from "react";
import { type RouteMode } from "./route-comparison";

export function ExperimentalNetwork({
  graph,
  result,
  selected,
  inspected,
  onInspect,
}: {
  graph: z.infer<typeof networkSchema>;
  result: FixtureResult;
  selected: RouteMode;
  inspected: string | null;
  onInspect: (edge: string | null) => void;
}) {
  const t = useTranslations("Experimental");
  const locale = useLocale();
  const id = useId().replaceAll(":", "");
  const [hovered, setHovered] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [previewPosition, setPreviewPosition] = useState({
    x: 8,
    y: 8,
    width: 192,
  });
  const preview = (event: PointerEvent<SVGGElement>, edgeId: string) => {
    if (event.pointerType !== "mouse") return;
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(192, rect.width - 16);
    setPreviewPosition({
      x: Math.max(
        8,
        Math.min(event.clientX - rect.left + 12, rect.width - width - 8),
      ),
      y: Math.max(8, Math.min(event.clientY - rect.top + 12, rect.height - 72)),
      width,
    });
    setHovered(edgeId);
  };
  const selectRef = useRef<HTMLButtonElement>(null);
  const clear = () => {
    onInspect(null);
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
  const labelLayout = stopLabels(
    points,
    stops.map(({ role, label }) => ({
      role,
      nodeId: result.request[role],
      label: t(label),
    })),
    viewBox,
  );
  const changed = new Set(result.frame.changed_edge_ids);
  const number = (v: number | null | undefined) =>
    v == null
      ? t("unknown")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(v);
  return (
    <div
      className="contents"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          clear();
        }
      }}
    >
      <section className="order-1 min-w-0 space-y-3 rounded-2xl border bg-card p-3 sm:p-5 lg:col-start-1 lg:row-start-1 lg:row-span-2">
        <div>
          <h2 className="text-lg font-semibold">{t("networkTitle")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("schematic")}</p>
        </div>
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
        <div
          ref={surfaceRef}
          className="network-surface relative rounded-xl border"
        >
          <svg
            viewBox={labelLayout.viewBox}
            role="img"
            aria-label={t("preview")}
            aria-describedby={`${id}-help`}
            className="route-canvas block w-full"
            data-frame={result.frame.step}
            data-selected-route={selected}
          >
            <desc>
              {stops
                .map(
                  ({ role, label }) => `${t(label)}: ${result.request[role]}`,
                )
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
                  onPointerEnter={(event) => preview(event, edgeId)}
                  onPointerMove={(event) => preview(event, edgeId)}
                  onPointerLeave={() => setHovered(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onInspect(edgeId);
                    setHovered(null);
                    selectRef.current?.focus({ preventScroll: true });
                  }}
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
                      d="M -4 -4 L 1 0 L -4 4"
                      fill="none"
                      stroke={isSelected ? "var(--card)" : color}
                      strokeWidth={isSelected ? 2 : 1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      transform={`translate(${geometry.mid.x} ${geometry.mid.y}) rotate(${geometry.angle})`}
                      opacity={isSelected || isAlternative ? 1 : 0.5}
                    />
                  )}
                  {changed.has(edgeId) && (
                    <circle
                      cx={
                        geometry.mid.x -
                        Math.sin((geometry.angle * Math.PI) / 180) * 8
                      }
                      cy={
                        geometry.mid.y +
                        Math.cos((geometry.angle * Math.PI) / 180) * 8
                      }
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
                      roles.length
                        ? "var(--foreground)"
                        : "var(--edge-unrelated)"
                    }
                    strokeWidth={roles.length ? 2 : 1.5}
                  />
                  {roles.length > 1 && (
                    <rect
                      x={p.x - 15}
                      y={p.y - 15}
                      width={30 + (roles.length - 1) * 20}
                      height={30}
                      rx={15}
                      fill="var(--card)"
                      stroke="var(--foreground)"
                      strokeWidth={2}
                    />
                  )}
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
                        x={(labelLayout.labels.get(role)?.x ?? p.x) - p.x}
                        y={(labelLayout.labels.get(role)?.y ?? p.y - 30) - p.y}
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
          {hovered && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-10 flex h-16 flex-col justify-center rounded-lg border bg-popover px-3 text-xs shadow-md"
              style={{
                left: previewPosition.x,
                top: previewPosition.y,
                width: previewPosition.width,
              }}
            >
              <p className="truncate font-semibold">{hovered}</p>
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
        {journeys.baseline.every(
          (leg, index) =>
            leg.status === "found" &&
            journeys.weighted[index].status === "found" &&
            JSON.stringify(leg.edgeIds) ===
              JSON.stringify(journeys.weighted[index].edgeIds),
        ) && <p className="text-xs text-muted-foreground">{t("sharedPath")}</p>}
        <p className="border-t pt-3 text-xs text-muted-foreground">
          {t("networkProvenance")}
        </p>
        {journeys[selected].some((leg) => leg.status === "unreachable") && (
          <p role="status" className="text-sm">
            {t("unreachable")}
          </p>
        )}
      </section>
      <div className="order-3 min-w-0 rounded-2xl border bg-card p-4 lg:col-start-2 lg:row-start-2">
        <DemoSelect
          id={`${id}-edge`}
          label={t("inspect")}
          inputRef={selectRef}
          value={edgeId}
          onChange={onInspect}
          options={graph.edges.map((e) => ({
            value: e.edge_id,
            label: `${e.edge_id} · ${e.source_node} → ${e.target_node}`,
          }))}
        />
        <p
          id={`${id}-help`}
          className={edge ? "sr-only" : "my-3 text-xs text-muted-foreground"}
        >
          {t("inspectHelp")}
        </p>
        {edge && (
          <div
            data-testid="edge-inspector"
            aria-live="polite"
            className="space-y-3"
          >
            <div className="mt-3 flex items-start justify-between gap-2">
              <p className="min-w-0 break-all text-sm font-semibold">
                {edge.edge_id}
                <span className="mt-1 block font-normal text-muted-foreground">
                  {edge.source_node} → {edge.target_node}
                </span>
              </p>
              <Button
                variant="ghost"
                className="min-h-11 min-w-11 shrink-0"
                onClick={clear}
                aria-label={t("clearSelection")}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">{t("weight")}</dt>
                <dd className="font-semibold tabular-nums">
                  {number(sample?.weight)}{" "}
                  <span className="text-xs font-normal">{t("units")}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("membership")}
                </dt>
                <dd className="mt-1">
                  {[
                    baseline.has(edgeId) ? t("baseline") : null,
                    weighted.has(edgeId) ? t("weighted") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || t("contextSegment")}
                </dd>
              </div>
              <div>
                <dt className="sr-only">{t("changedValueLegend")}</dt>
                <dd className="text-xs text-muted-foreground">
                  {result.frame.previous_step === null
                    ? t("initial")
                    : !sample
                      ? t("unknown")
                      : changed.has(edgeId)
                        ? t("segmentChanged")
                        : t("segmentUnchanged")}
                </dd>
              </div>
            </dl>
            <Disclosure title={t("technicalDetails")}>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {(
                  [
                    ["h_m", sample?.h_m],
                    ["u_ms", sample?.u_ms],
                    ["v_ms", sample?.v_ms],
                    [
                      "delta",
                      result.frame.previous_step === null
                        ? null
                        : result.frame.weight_deltas[edgeId],
                    ],
                    ["segmentDistance", edge.length_m],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">
                      {t(label)}
                    </dt>
                    <dd className="mt-1 font-medium tabular-nums">
                      {number(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t("unitsCaveat")}
              </p>
              <p className="mt-3 break-words text-xs text-muted-foreground">
                {t("source")}: {result.dataset_id} / {result.dataset_version} ·{" "}
                {result.network_id} · {result.weighting_version}
              </p>
            </Disclosure>
          </div>
        )}
      </div>
    </div>
  );
}
