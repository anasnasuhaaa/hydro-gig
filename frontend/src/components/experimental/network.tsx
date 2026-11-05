"use client";
import { useTranslations } from "next-intl";
import { type z } from "zod";
import { type networkSchema } from "@/lib/api/experimental";
export function ExperimentalNetwork({
  graph,
  baseline,
  weighted,
}: {
  graph: z.infer<typeof networkSchema>;
  baseline: Set<string>;
  weighted: Set<string>;
}) {
  const t = useTranslations("Experimental");
  return (
    <svg
      viewBox="0 0 600 400"
      role="img"
      aria-label={t("preview")}
      className="max-h-96 w-full"
    >
      <defs>
        <marker
          id="arrow"
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
      {(() => {
        const xs = graph.nodes.map((n) => n.x),
          ys = graph.nodes.map((n) => n.y);
        const minX = Math.min(...xs),
          minY = Math.min(...ys);
        const dx = Math.max(...xs) - minX || 1,
          dy = Math.max(...ys) - minY || 1;
        const points = Object.fromEntries(
          graph.nodes.map((n) => [
            n.node_id,
            {
              x: 30 + (540 * (n.x - minX)) / dx,
              y: 370 - (340 * (n.y - minY)) / dy,
            },
          ]),
        );
        return (
          <>
            {graph.edges.map((e) => (
              <g key={e.edge_id}>
                <line
                  x1={points[e.source_node].x}
                  y1={points[e.source_node].y}
                  x2={points[e.target_node].x}
                  y2={points[e.target_node].y}
                  stroke={baseline.has(e.edge_id) ? "#2563eb" : "#94a3b8"}
                  strokeWidth={baseline.has(e.edge_id) ? 7 : 2}
                  markerEnd="url(#arrow)"
                />
                {weighted.has(e.edge_id) && (
                  <line
                    x1={points[e.source_node].x}
                    y1={points[e.source_node].y}
                    x2={points[e.target_node].x}
                    y2={points[e.target_node].y}
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeDasharray="7 3"
                  />
                )}
              </g>
            ))}
            {graph.nodes.map((n) => (
              <g key={n.node_id}>
                <circle
                  {...{
                    cx: points[n.node_id].x,
                    cy: points[n.node_id].y,
                  }}
                  r="5"
                  fill="currentColor"
                />
                <text
                  x={points[n.node_id].x + 8}
                  y={points[n.node_id].y - 6}
                  fontSize="13"
                  fill="currentColor"
                >
                  {n.node_id}
                </text>
              </g>
            ))}
          </>
        );
      })()}
    </svg>
  );
}
