import { z } from "zod";
import { identifierSchema, provenanceSchema } from "./data";

export const evidenceReferenceSchema = z.strictObject({
  evidence_id: identifierSchema,
  edge_id: identifierSchema,
  captured_at: z.iso.datetime({ offset: true }),
  provenance: provenanceSchema,
  source_dataset_id: identifierSchema,
  source_version: identifierSchema,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export const claimRequestSchema = z.strictObject({
  trip_id: identifierSchema,
  network_id: identifierSchema,
  scenario_id: identifierSchema,
  step: identifierSchema,
  occurred_at: z.iso.datetime({ offset: true }),
  route_edge_ids: z.array(identifierSchema).min(1),
  evidence: z.array(evidenceReferenceSchema).min(1),
  parameter_version: identifierSchema,
  consent_reference: identifierSchema,
});
export const claimResponseSchema = z.strictObject({
  status: z.literal("unavailable").default("unavailable"),
  reason: z
    .string()
    .default(
      "Evidence persistence, authorization and signing are not integrated.",
    ),
  token: z.null().default(null),
});
