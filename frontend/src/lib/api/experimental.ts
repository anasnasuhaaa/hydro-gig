import { z } from "zod";
import { apiRequest } from "./client";
const finite = z.number().finite();
const positive = finite.positive();
const nonnegative = finite.nonnegative();
const metadata = {
  dataset_id: z.literal("small-fixture"),
  dataset_version: z.literal("1"),
  network_id: z.literal("small-directed-v1"),
  network_version: z.literal("1"),
  scenario_id: z.literal("small-inundation-v1"),
  network_source: z.literal("unknown"),
  scenario_source: z.literal("unknown"),
  replay_status: z.literal("simulated_unverified"),
  route_provenance: z.literal("experimental_computation"),
  algorithm_version: z.string(),
  weighting_version: z.string(),
  missing_data: z.array(z.string()),
  limitations: z.array(z.string()),
  field_provenance: z.record(z.string(), z.string()),
};
export const networkSchema = z
  .strictObject({
    ...metadata,
    source_hashes: z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)),
    nodes: z
      .array(z.strictObject({ node_id: z.string(), x: finite, y: finite }))
      .min(1),
    edges: z
      .array(
        z.strictObject({
          edge_id: z.string(),
          source_node: z.string(),
          target_node: z.string(),
          length_m: positive,
          oneway: z.literal(true),
        }),
      )
      .min(1),
  })
  .superRefine((n, ctx) => {
    const ids = new Set(n.nodes.map((n) => n.node_id));
    if (
      ids.size !== n.nodes.length ||
      new Set(n.edges.map((e) => e.edge_id)).size !== n.edges.length ||
      n.edges.some((e) => !ids.has(e.source_node) || !ids.has(e.target_node))
    )
      ctx.addIssue({ code: "custom", message: "Invalid graph" });
  });
const frameSchema = z.strictObject({
  ...metadata,
  step: z.string(),
  timestamp: z.iso.datetime({ offset: true }),
  samples: z.record(
    z.string(),
    z.strictObject({
      weight: nonnegative,
      h_m: nonnegative.nullable(),
      u_ms: finite.nullable(),
      v_ms: finite.nullable(),
    }),
  ),
  previous_step: z.string().nullable(),
  changed_edge_ids: z.array(z.string()),
  weight_deltas: z.record(z.string(), finite),
});
export const requestSchema = z.strictObject({
  origin: z.string().min(1),
  pickup: z.string().min(1),
  destination: z.string().min(1),
  scenario_id: z.literal("small-inundation-v1"),
  step: z.enum(["t0", "t1", "t2", "t3", "t4"]),
});
export type FixtureRequest = z.infer<typeof requestSchema>;
const pathSchema = z
  .strictObject({
    status: z.enum(["found", "unreachable"]),
    node_ids: z.array(z.string()),
    edge_ids: z.array(z.string()),
    distance_m: nonnegative.nullable(),
    objective_cost: nonnegative.nullable(),
    cost_unit: z.enum(["m", "experimental_units"]),
  })
  .refine((p) =>
    p.status === "found"
      ? p.node_ids.length === p.edge_ids.length + 1 &&
        p.distance_m !== null &&
        p.objective_cost !== null
      : p.node_ids.length === 0 &&
        p.edge_ids.length === 0 &&
        p.distance_m === null &&
        p.objective_cost === null,
  );
const alternatives = z.strictObject({
  baseline: pathSchema,
  weighted: pathSchema,
});
export const resultSchema = z
  .strictObject({
    ...metadata,
    request: requestSchema,
    frame: frameSchema,
    origin_to_pickup: alternatives,
    pickup_to_destination: alternatives,
  })
  .refine(
    (r) =>
      r.frame.step === r.request.step &&
      r.frame.scenario_id === r.request.scenario_id,
  );
export type FixtureResult = z.infer<typeof resultSchema>;
export const experimentalApi = {
  network: (signal?: AbortSignal) =>
    apiRequest("/network", networkSchema, { signal }, "/api/v1/experimental"),
  screen: (body: FixtureRequest, signal?: AbortSignal) =>
    apiRequest(
      "/routes/screen",
      resultSchema,
      { body, signal },
      "/api/v1/experimental",
    ),
};

const sampleSchema = frameSchema.shape.samples;
const evidenceContentSchema = z.strictObject({
  schema_version: z.literal("experimental-evidence-v1"),
  scenario_version: z.literal("1"),
  submission_status: z.literal("not_submitted"),
  token: z.null(),
  signature: z.null(),
  source_hashes: z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)),
  calculation: resultSchema,
  route_samples: sampleSchema,
  affected_route_edge_ids: z.array(z.string()),
  limitations: z.array(z.string()),
});
export const evidenceSchema = z.strictObject({
  created_at: z.iso.datetime({ offset: true }),
  canonicalization: z.literal("python-json-sorted-utf8-v1"),
  digest_scope: z.literal("content_only_excludes_created_at"),
  content: evidenceContentSchema,
  canonical_content: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export type EvidencePreview = z.infer<typeof evidenceSchema>;
export async function getEvidencePreview(
  body: FixtureRequest,
): Promise<EvidencePreview> {
  const result = await apiRequest(
    "/evidence/preview",
    evidenceSchema,
    { body },
    "/api/v1/experimental",
  );
  const canonical = evidenceContentSchema.parse(
    JSON.parse(result.canonical_content),
  );
  const stable = (value: unknown): string =>
    JSON.stringify(value, (_, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(
            Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
          )
        : v,
    );
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(result.canonical_content),
  );
  const digest = Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  if (
    digest !== result.sha256 ||
    stable(canonical) !== stable(result.content) ||
    stable(canonical.calculation.request) !== stable(body)
  )
    throw new Error("Invalid evidence preview");
  return result;
}
