"use client";
import { useTranslations, useFormatter } from "next-intl";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  DemoFrame,
  RoadNetwork,
  ScreenResponse,
} from "@/lib/contracts/data";

/** Drawing-only adapter. Replace with GeoJSON/MapLibre after CRS and licensing validation. */
export function SchematicNetwork({
  network,
  result,
  frame,
}: {
  network: RoadNetwork;
  result: ScreenResponse;
  frame: DemoFrame;
}) {
  const t = useTranslations("Network");
  const timeline = useTranslations("Timeline");
  const format = useFormatter();
  const isMobile = useIsMobile();
  if (
    network.crs !== "LOCAL:SCHEMATIC" ||
    network.nodes.some((node) => !node.coordinates)
  )
    return <p>{t("unavailable")}</p>;
  const positions = network.nodes.map((node) => node.coordinates!.position);
  const xs = positions.map((p) => p[0]),
    ys = positions.map((p) => p[1]);
  const minX = Math.min(...xs),
    minY = Math.min(...ys);
  const dx = Math.max(...xs) - minX || 1,
    dy = Math.max(...ys) - minY || 1;
  const points = new Map(
    network.nodes.map((node) => [
      node.node_id,
      {
        x: isMobile
          ? 50 + ((node.coordinates!.position[1] - minY) / dy) * 200
          : 50 + ((node.coordinates!.position[0] - minX) / dx) * 680,
        y: isMobile
          ? 35 + ((node.coordinates!.position[0] - minX) / dx) * 390
          : 45 + ((node.coordinates!.position[1] - minY) / dy) * 250,
      },
    ]),
  );
  const baseline = new Set([
    ...result.origin_to_pickup.baseline.edge_ids,
    ...result.pickup_to_destination.baseline.edge_ids,
  ]);
  const weighted = new Set([
    ...result.origin_to_pickup.demonstration_weighted.edge_ids,
    ...result.pickup_to_destination.demonstration_weighted.edge_ids,
  ]);
  return (
    <figure className="space-y-3">
      <svg
        viewBox={isMobile ? "0 0 300 460" : "0 0 780 340"}
        role="img"
        aria-label={t("label", { step: timeline(frame.frame.step) })}
        className="w-full rounded-xl border bg-muted/40"
      >
        <title>{t("title")}</title>
        <desc>{t("desc")}</desc>
        <defs>
          <marker
            id="schematic-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
        {network.segments.map((edge) => {
          const source = points.get(edge.source_node)!,
            target = points.get(edge.target_node)!;
          const dx = target.x - source.x,
            dy = target.y - source.y,
            length = Math.hypot(dx, dy) || 1;
          const affected = frame.affected_edge_ids.includes(edge.edge_id);
          return (
            <g
              key={edge.edge_id}
              className={
                weighted.has(edge.edge_id)
                  ? "text-primary"
                  : baseline.has(edge.edge_id)
                    ? "text-route-baseline"
                    : "text-muted-foreground"
              }
            >
              <title>
                {t("edge", {
                  id: edge.edge_id,
                  source: edge.source_node,
                  target: edge.target_node,
                  cost: format.number(frame.edge_costs[edge.edge_id]),
                })}
                {affected ? t("affected") : ""}
              </title>
              <line
                x1={source.x + (dx / length) * 20}
                y1={source.y + (dy / length) * 20}
                x2={target.x - (dx / length) * 23}
                y2={target.y - (dy / length) * 23}
                stroke="currentColor"
                strokeWidth={weighted.has(edge.edge_id) ? 5 : 2}
                strokeDasharray={
                  !weighted.has(edge.edge_id) && baseline.has(edge.edge_id)
                    ? "7 5"
                    : undefined
                }
                markerEnd="url(#schematic-arrow)"
              />
              <text
                x={(source.x + target.x) / 2 + (isMobile && dy !== 0 ? -24 : 0)}
                y={(source.y + target.y) / 2 - (isMobile && dy !== 0 ? 0 : 12)}
                textAnchor="middle"
                className={
                  affected
                    ? "fill-risk-moderate text-[16px] font-bold"
                    : "fill-foreground text-[16px]"
                }
              >
                {edge.edge_id}
                {affected ? " *" : ""}
              </text>
            </g>
          );
        })}
        {network.nodes.map((node) => {
          const point = points.get(node.node_id)!;
          return (
            <g key={node.node_id}>
              <title>{node.node_id}</title>
              <circle
                cx={point.x}
                cy={point.y}
                r={17}
                className="fill-card stroke-primary"
                strokeWidth={2}
              />
              <text
                x={point.x}
                y={point.y + 5}
                textAnchor="middle"
                className="fill-foreground text-[16px] font-semibold"
              >
                {node.node_id}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label={t("legend")}>
          <li className="flex items-center gap-2">
            <span
              className="w-6 border-t-4 border-primary"
              aria-hidden="true"
            />
            {t("weighted")}
          </li>
          <li className="flex items-center gap-2">
            <span
              className="w-6 border-t-2 border-dashed border-route-baseline"
              aria-hidden="true"
            />
            {t("baseline")}
          </li>
          <li>{t("change")}</li>
        </ul>
        <p>{t("caveat")}</p>
      </figcaption>
    </figure>
  );
}
