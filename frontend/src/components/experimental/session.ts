"use client";
import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { requestSchema, type FixtureRequest } from "@/lib/api/experimental";
export const initial: FixtureRequest = {
  origin: "N01",
  pickup: "N03",
  destination: "N12",
  scenario_id: "small-inundation-v1",
  step: "t0",
};
const node = z.enum(
  Array.from(
    { length: 12 },
    (_, i) => `N${String(i + 1).padStart(2, "0")}`,
  ) as [string, ...string[]],
);
const schema = z.strictObject({
  schema_version: z.literal(1),
  dataset_id: z.literal("small-fixture"),
  dataset_version: z.literal("1"),
  network_id: z.literal("small-directed-v1"),
  network_version: z.literal("1"),
  enabled: z.boolean(),
  request: requestSchema.extend({
    origin: node,
    pickup: node,
    destination: node,
  }),
  route_refs: z.array(z.string().regex(/^E_\d{2}_\d{2}$/)),
});
const empty = schema.parse({
  schema_version: 1,
  dataset_id: "small-fixture",
  dataset_version: "1",
  network_id: "small-directed-v1",
  network_version: "1",
  enabled: false,
  request: initial,
  route_refs: [],
});
const key = "hydrogig-experimental-v1",
  event = "hydrogig-experimental-change";
let memory: string | null = null,
  blocked = false;
function snapshot() {
  try {
    return blocked ? memory : sessionStorage.getItem(key);
  } catch {
    return memory;
  }
}
function parse(raw: string | null | undefined) {
  try {
    return schema.parse(JSON.parse(raw ?? "null"));
  } catch {
    return empty;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener(event, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(event, callback);
    window.removeEventListener("storage", callback);
  };
}
const serverSnapshot = () => undefined;
function write(value: z.infer<typeof schema>) {
  memory = JSON.stringify(schema.parse(value));
  try {
    sessionStorage.setItem(key, memory);
  } catch {
    blocked = true;
  }
  window.dispatchEvent(new Event(event));
}
export function useExperimentalSession() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const selection = useMemo(() => parse(raw), [raw]);
  return {
    ...selection,
    ready: raw !== undefined,
    invalid:
      !!raw &&
      !schema.safeParse(
        (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })(),
      ).success,
    setEnabled: (enabled: boolean) => write({ ...selection, enabled }),
    setRequest: (request: FixtureRequest) =>
      write({ ...selection, request, route_refs: [] }),
    remember: (route_refs: string[]) =>
      write({ ...selection, enabled: true, route_refs }),
    reset: () => write({ ...empty, enabled: true }),
  };
}
