import { type z } from "zod";
import { type networkSchema, type FixtureResult } from "@/lib/api/experimental";
import { type RouteMode } from "./route-comparison";

type Graph = z.infer<typeof networkSchema>;
export type Point = { x: number; y: number };
export const tripLegs = ["origin_to_pickup", "pickup_to_destination"] as const;

// Preserve API traversal order and validate connectivity before drawing a leg.
// A broken sequence must never create a plausible shortcut on the schematic.
export function orderedJourney(
  graph: Graph,
  result: FixtureResult,
  mode: RouteMode,
) {
  const edges = new Map(graph.edges.map((edge) => [edge.edge_id, edge]));
  return tripLegs.map((leg) => {
    const path = result[leg][mode];
    const valid =
      path.status === "found" &&
      path.edge_ids.every((id, index) => {
        const edge = edges.get(id);
        return (
          edge?.source_node === path.node_ids[index] &&
          edge?.target_node === path.node_ids[index + 1]
        );
      });
    return {
      leg,
      status: path.status,
      edgeIds: valid ? path.edge_ids : [],
      nodeIds: valid ? path.node_ids : [],
    };
  });
}

export function networkGeometry(graph: Graph) {
  const xs = graph.nodes.map((node) => node.x);
  const ys = graph.nodes.map((node) => node.y);
  const minX = Math.min(...xs),
    minY = Math.min(...ys);
  const dx = Math.max(...xs) - minX || 1,
    dy = Math.max(...ys) - minY || 1;
  const points = new Map(
    graph.nodes.map((node) => [
      node.node_id,
      {
        x: (420 * (node.x - minX)) / dx,
        y: 300 - (300 * (node.y - minY)) / dy,
      },
    ]),
  );
  // JSON tuples avoid ambiguous IDs (including colons or object prototype names).
  const pairs = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const key = JSON.stringify([edge.source_node, edge.target_node]);
    pairs.set(key, [...(pairs.get(key) ?? []), edge.edge_id].sort());
  }
  const bounds = [...points.values()];
  const paths = new Map(
    graph.edges.map((edge) => {
      const a = points.get(edge.source_node)!,
        b = points.get(edge.target_node)!;
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const siblings = pairs.get(
        JSON.stringify([edge.source_node, edge.target_node]),
      )!;
      const rank = siblings.indexOf(edge.edge_id);
      const reverse = pairs.has(
        JSON.stringify([edge.target_node, edge.source_node]),
      );
      const bend = reverse ? 24 + rank * 20 : 8 + rank * 20;
      let d: string, mid: Point, angle: number;
      if (length < 1) {
        // Coincident coordinates/self-links remain inspectable loops, not NaN paths.
        const radius = 28 + rank * 14;
        const side = edge.source_node <= edge.target_node ? 1 : -1;
        const c1 = { x: a.x + radius * side, y: a.y - radius * 2 };
        const c2 = { x: b.x - radius * side, y: b.y - radius * 2 };
        d = `M ${a.x} ${a.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
        mid = { x: a.x, y: a.y - radius * 1.5 };
        angle = side === 1 ? 180 : 0;
        bounds.push(c1, c2);
      } else {
        const c = {
          x: (a.x + b.x) / 2 - ((b.y - a.y) / length) * bend,
          y: (a.y + b.y) / 2 + ((b.x - a.x) / length) * bend,
        };
        d = `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
        mid = { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 };
        angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        bounds.push(c);
      }
      return [edge.edge_id, { d, mid, angle, length }];
    }),
  );
  const left = Math.min(...bounds.map((p) => p.x)) - 70;
  const top = Math.min(...bounds.map((p) => p.y)) - 60;
  const width = Math.max(...bounds.map((p) => p.x)) + 70 - left;
  const height = Math.max(...bounds.map((p) => p.y)) + 60 - top;
  return { points, paths, viewBox: `${left} ${top} ${width} ${height}` };
}

// Labels are placed in schematic space, independently of node IDs. Include
// their measured-by-design extents in the viewBox so edge stops never clip.
export function stopLabels(
  points: Map<string, Point>,
  stops: { role: string; nodeId: string; label: string }[],
  viewBox: string,
) {
  const boxes: { x: number; y: number; width: number; height: number }[] = [];
  const labels = new Map(
    stops.map(({ role, nodeId, label }) => {
      const p = points.get(nodeId);
      if (!p) return [role, null];
      const width = Array.from(label).length * 10 + 12;
      const candidates = [30, 58, 86, 114].flatMap((gap) => [
        { x: p.x, y: p.y - gap },
        { x: p.x, y: p.y + gap + 10 },
        { x: p.x - width / 2 - gap, y: p.y + 5 },
        { x: p.x + width / 2 + gap, y: p.y + 5 },
      ]);
      const overlaps = (q: Point) => {
        const box = { x: q.x - width / 2, y: q.y - 18, width, height: 24 };
        const nodes = [...points.values()].filter(
          (n) =>
            n.x + 17 > box.x &&
            n.x - 17 < box.x + width &&
            n.y + 17 > box.y &&
            n.y - 17 < box.y + box.height,
        ).length;
        const labels = boxes.filter(
          (b) =>
            b.x + b.width + 6 > box.x &&
            b.x - 6 < box.x + width &&
            b.y + b.height + 6 > box.y &&
            b.y - 6 < box.y + box.height,
        ).length;
        return nodes + labels * 10;
      };
      const q = candidates.reduce((best, candidate) =>
        overlaps(candidate) < overlaps(best) ? candidate : best,
      );
      boxes.push({ x: q.x - width / 2, y: q.y - 18, width, height: 24 });
      return [role, q];
    }),
  );
  const [x, y, width, height] = viewBox.split(" ").map(Number);
  const left = Math.min(x, ...boxes.map((b) => b.x - 8));
  const top = Math.min(y, ...boxes.map((b) => b.y - 8));
  const right = Math.max(x + width, ...boxes.map((b) => b.x + b.width + 8));
  const bottom = Math.max(y + height, ...boxes.map((b) => b.y + b.height + 8));
  return { labels, viewBox: `${left} ${top} ${right - left} ${bottom - top}` };
}
