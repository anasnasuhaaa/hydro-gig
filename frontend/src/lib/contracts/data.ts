import { z } from "zod";

export const identifierSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/);
const nonnegative = z.number().finite().nonnegative();
const finite = z.number().finite();
export const provenanceSchema = z.enum([
  "observed",
  "simulated",
  "model_predicted",
]);
export const stepSchema = z.enum(["t0", "t1", "t2"]);
const crsSchema = z.enum(["EPSG:4326", "LOCAL:SCHEMATIC"]);
const positionSchema = z.tuple([finite, finite]);
const geographicRange = (position: [number, number]) =>
  position[0] >= -180 &&
  position[0] <= 180 &&
  position[1] >= -90 &&
  position[1] <= 90;
export const coordinatesSchema = z
  .strictObject({ crs: crsSchema, position: positionSchema })
  .refine(
    (value) => value.crs !== "EPSG:4326" || geographicRange(value.position),
    "Invalid longitude/latitude",
  );
export const roadNodeSchema = z.strictObject({
  node_id: identifierSchema,
  label: z.string().nullable().default(null),
  coordinates: coordinatesSchema.nullable().default(null),
});
export const lineGeometrySchema = z
  .strictObject({
    type: z.literal("LineString").default("LineString"),
    crs: crsSchema,
    coordinates: z.array(positionSchema).min(2),
  })
  .refine(
    (value) =>
      value.crs !== "EPSG:4326" || value.coordinates.every(geographicRange),
    "Invalid longitude/latitude",
  );
export const roadSegmentSchema = z.strictObject({
  edge_id: identifierSchema,
  source_node: identifierSchema,
  target_node: identifierSchema,
  length_m: finite.positive(),
  oneway: z.boolean(),
  geometry: lineGeometrySchema.nullable().default(null),
  metadata: z.record(z.string(), z.string()).default({}),
});
export const networkSchema = z
  .strictObject({
    network_id: identifierSchema,
    provenance: provenanceSchema,
    crs: crsSchema.nullable(),
    nodes: z.array(roadNodeSchema).min(1),
    segments: z.array(roadSegmentSchema),
  })
  .superRefine((network, ctx) => {
    const nodes = new Set(network.nodes.map((node) => node.node_id));
    const edges = new Set(network.segments.map((edge) => edge.edge_id));
    if (
      nodes.size !== network.nodes.length ||
      edges.size !== network.segments.length ||
      network.segments.some(
        (edge) =>
          !nodes.has(edge.source_node) ||
          !nodes.has(edge.target_node) ||
          (edge.geometry && edge.geometry.crs !== network.crs),
      ) ||
      network.nodes.some(
        (node) => node.coordinates && node.coordinates.crs !== network.crs,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Network IDs, endpoints or CRS are inconsistent",
      });
  });
export const timeStepSchema = z.strictObject({
  step: identifierSchema,
  timestamp: z.iso.datetime({ offset: true }),
});
export const floodScenarioSchema = z
  .strictObject({
    scenario_id: identifierSchema,
    name: z.string().min(1),
    provenance: provenanceSchema,
    network_id: identifierSchema,
    time_steps: z.array(timeStepSchema).min(1),
  })
  .refine(
    (scenario) =>
      new Set(scenario.time_steps.map((frame) => frame.step)).size ===
        scenario.time_steps.length &&
      scenario.time_steps.every(
        (frame, index, frames) =>
          index === 0 ||
          Date.parse(frames[index - 1].timestamp) < Date.parse(frame.timestamp),
      ),
    "Steps must be unique and chronologically ordered",
  );
export const floodObservationSchema = z.strictObject({
  edge_id: identifierSchema,
  timestamp: z.iso.datetime({ offset: true }),
  depth_m: nonnegative.nullable(),
  velocity_u_mps: finite.nullable(),
  velocity_v_mps: finite.nullable(),
  provenance: provenanceSchema,
});
export const riskAssessmentSchema = z
  .strictObject({
    edge_id: identifierSchema,
    risk_index: nonnegative.nullable(),
    parameter_version: identifierSchema,
    provenance: provenanceSchema,
    status: z.enum(["experimental", "unavailable"]),
  })
  .refine(
    (value) => (value.status === "unavailable") === (value.risk_index === null),
    "Unavailable risk must be null",
  );
export const calculationMetadataSchema = z.strictObject({
  algorithm: z.string(),
  engine_version: identifierSchema,
  weighting_version: identifierSchema,
  cost_unit: z.enum(["m", "demo_cost_units"]),
  warnings: z.array(z.string()),
});
export const routeResultSchema = z
  .strictObject({
    status: z.enum(["found", "unreachable"]),
    mode: z.enum(["shortest_distance", "demo_weighted"]),
    node_ids: z.array(identifierSchema),
    edge_ids: z.array(identifierSchema),
    total_length_m: nonnegative.nullable(),
    total_weighted_cost: nonnegative.nullable(),
    network_id: identifierSchema,
    scenario_id: identifierSchema,
    step: identifierSchema,
    provenance: provenanceSchema,
    calculation: calculationMetadataSchema,
  })
  .refine(
    (route) =>
      route.status === "unreachable"
        ? route.node_ids.length === 0 &&
          route.edge_ids.length === 0 &&
          route.total_length_m === null &&
          route.total_weighted_cost === null
        : route.node_ids.length === route.edge_ids.length + 1 &&
          route.total_length_m !== null &&
          route.total_weighted_cost !== null,
    "Inconsistent route path or totals",
  );

export const SIMULATION_LABEL =
  "SIMULATED DATA — NOT REAL-TIME FLOOD MONITORING";
const envelope = {
  experimental: z.literal(true),
  provenance: z.literal("simulated"),
  label: z.literal(SIMULATION_LABEL),
};
export const manifestSchema = z.strictObject({
  ...envelope,
  dataset_id: identifierSchema,
  version: identifierSchema,
  origin: z.string(),
  limitations: z.array(z.string()),
  default_trip: z.strictObject({
    origin: identifierSchema,
    pickup: identifierSchema,
    destination: identifierSchema,
  }),
});
export const demoNetworkSchema = z.strictObject({
  ...envelope,
  network: networkSchema.refine(
    (network) => network.provenance === "simulated",
    "Demo network must be simulated",
  ),
});
export const scenariosSchema = z.strictObject({
  ...envelope,
  scenarios: z
    .array(
      floodScenarioSchema.refine(
        (scenario) => scenario.provenance === "simulated",
        "Demo scenario must be simulated",
      ),
    )
    .min(1),
});
export const frameSchema = z.strictObject({
  ...envelope,
  scenario_id: identifierSchema,
  network_id: identifierSchema,
  frame: timeStepSchema,
  weighting_version: identifierSchema,
  edge_costs: z.record(identifierSchema, nonnegative),
  affected_edge_ids: z.array(identifierSchema),
  observations: z.array(floodObservationSchema),
  risk_assessments: z.array(riskAssessmentSchema),
  warning: z.string(),
});
export const screenRequestSchema = z
  .strictObject({
    origin: identifierSchema,
    pickup: identifierSchema,
    destination: identifierSchema,
    scenario_id: identifierSchema,
    step: stepSchema,
  })
  .refine(
    (value) =>
      new Set([value.origin, value.pickup, value.destination]).size === 3,
    {
      message:
        "Choose three different nodes for origin, pickup and destination.",
      path: ["destination"],
    },
  );
const alternativesSchema = z.strictObject({
  baseline: routeResultSchema,
  demonstration_weighted: routeResultSchema,
});
export const screenResponseSchema = z
  .strictObject({
    ...envelope,
    request: screenRequestSchema,
    network_id: identifierSchema,
    frame: frameSchema,
    origin_to_pickup: alternativesSchema,
    pickup_to_destination: alternativesSchema,
    warnings: z.array(z.string()).min(1),
  })
  .refine((value) => {
    const routes = [
      value.origin_to_pickup.baseline,
      value.origin_to_pickup.demonstration_weighted,
      value.pickup_to_destination.baseline,
      value.pickup_to_destination.demonstration_weighted,
    ];
    return (
      value.frame.network_id === value.network_id &&
      value.frame.scenario_id === value.request.scenario_id &&
      value.frame.frame.step === value.request.step &&
      routes.every(
        (route) =>
          route.network_id === value.network_id &&
          route.scenario_id === value.request.scenario_id &&
          route.step === value.request.step &&
          route.provenance === "simulated",
      )
    );
  }, "Inconsistent scenario, frame or provenance in route response");
export type RoadNetwork = z.infer<typeof networkSchema>;
export type RouteResult = z.infer<typeof routeResultSchema>;
export type ScreenRequest = z.infer<typeof screenRequestSchema>;
export type ScreenResponse = z.infer<typeof screenResponseSchema>;
export type DemoFrame = z.infer<typeof frameSchema>;
