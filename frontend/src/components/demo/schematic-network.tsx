"use client";
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
  if (
    network.crs !== "LOCAL:SCHEMATIC" ||
    network.nodes.some((node) => !node.coordinates)
  )
    return <p>Schematic positions are unavailable.</p>;
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
        x: 50 + ((node.coordinates!.position[0] - minX) / dx) * 680,
        y: 45 + ((node.coordinates!.position[1] - minY) / dy) * 250,
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
        viewBox="0 0 780 340"
        role="img"
        aria-label={`Synthetic directed road network at ${frame.frame.step}`}
        className="w-full rounded-xl border bg-muted/40"
      >
        <title>Schematic road network — simulated, not a geographic map</title>
        <desc>
          Arrows indicate permitted direction. Solid teal is the
          demonstration-weighted route; dashed blue is the distance baseline.
          Amber labels identify authored cost changes.
        </desc>
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
                    ? "text-secondary-foreground"
                    : "text-muted-foreground"
              }
            >
              <title>
                {edge.edge_id}: {edge.source_node} to {edge.target_node}; cost{" "}
                {frame.edge_costs[edge.edge_id]} demo units
                {affected ? "; simulated cost change" : ""}
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
                x={(source.x + target.x) / 2}
                y={(source.y + target.y) / 2 - 10}
                textAnchor="middle"
                className={
                  affected
                    ? "fill-risk-moderate text-[14px] font-bold"
                    : "fill-foreground text-[13px]"
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
              <title>
                {node.node_id} · {node.label}
              </title>
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
                className="fill-foreground text-[14px] font-semibold"
              >
                {node.node_id}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-xs leading-relaxed text-muted-foreground">
        Schematic only · no geographic relationship to Bogor. Teal:
        demonstration-weighted selection. Dashed blue: baseline-only segments. *
        Authored cost change. Colors convey software state, with no official
        safety meaning.
      </figcaption>
    </figure>
  );
}
