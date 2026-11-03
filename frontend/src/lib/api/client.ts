import { z } from "zod";

export const systemStatusSchema = z.object({
  application: z.literal("operational"),
  phase: z.literal("foundation"),
  checked_at: z.iso.datetime({ offset: true }),
  database: z.object({
    configured: z.boolean(),
    reachable: z.boolean(),
    state: z.enum(["not_configured", "reachable", "unreachable"]),
  }),
  flood_data: z.literal("unavailable"),
});

export type SystemStatus = z.infer<typeof systemStatusSchema>;

const baseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export async function getSystemStatus(
  signal?: AbortSignal,
): Promise<SystemStatus> {
  const response = await fetch(`${baseUrl}/api/v1/system/status`, {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(8_000)])
      : AbortSignal.timeout(8_000),
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("The API could not return its status. Please retry.");
  const parsed = systemStatusSchema.safeParse(await response.json());
  if (!parsed.success)
    throw new Error("The API returned an unexpected status response.");
  return parsed.data;
}
