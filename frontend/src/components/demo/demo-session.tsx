"use client";
import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { z } from "zod";
import {
  screenRequestSchema,
  type RoadNetwork,
  type ScreenRequest,
} from "@/lib/contracts/data";

const storageKey = "hydrogig-demo-v1";
const changeEvent = "hydrogig-demo-change";
const selectionSchema = z.strictObject({
  routeChoice: z.enum(["default", "screened"]),
  request: screenRequestSchema.nullable(),
  screenedTrip: screenRequestSchema.nullable(),
});
type Selection = z.infer<typeof selectionSchema>;
const empty: Selection = {
  routeChoice: "default",
  request: null,
  screenedTrip: null,
};
// Browser-only fallback when sessionStorage is unavailable. No GPS or API results are stored.
let memorySnapshot: string | null = null;
let storageUnavailable = false;
function snapshot(): string | null {
  if (storageUnavailable) return memorySnapshot;
  try {
    return window.sessionStorage.getItem(storageKey);
  } catch {
    return memorySnapshot;
  }
}
function parse(raw: string | null | undefined): Selection {
  try {
    return selectionSchema.parse(JSON.parse(raw ?? "null"));
  } catch {
    return empty;
  }
}
function subscribe(notify: () => void) {
  window.addEventListener(changeEvent, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(changeEvent, notify);
    window.removeEventListener("storage", notify);
  };
}
const serverSnapshot = () => undefined;
function update(change: (selection: Selection) => Selection) {
  memorySnapshot = JSON.stringify(
    selectionSchema.parse(change(parse(snapshot()))),
  );
  try {
    window.sessionStorage.setItem(storageKey, memorySnapshot);
  } catch {
    storageUnavailable = true;
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function isAvailableDemoTrip(
  request: ScreenRequest | null,
  network: RoadNetwork,
  scenarios: { scenario_id: string; time_steps: { step: string }[] }[],
): request is ScreenRequest {
  return (
    !!request &&
    [request.origin, request.pickup, request.destination].every((id) =>
      network.nodes.some((node) => node.node_id === id),
    ) &&
    scenarios.some(
      (scenario) =>
        scenario.scenario_id === request.scenario_id &&
        scenario.time_steps.some((frame) => frame.step === request.step),
    )
  );
}

type Session = Selection & {
  ready: boolean;
  setRouteChoice: (choice: "default" | "screened") => void;
  setRequest: (request: ScreenRequest) => void;
  rememberTrip: (request: ScreenRequest) => void;
  reset: (request: ScreenRequest) => void;
};
const DemoSession = createContext<Session | null>(null);
export function DemoSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const selection = useMemo(() => parse(raw), [raw]);
  return (
    <DemoSession.Provider
      value={{
        ...selection,
        ready: raw !== undefined,
        setRouteChoice: (routeChoice) =>
          update((current) => ({ ...current, routeChoice })),
        setRequest: (request) => update((current) => ({ ...current, request })),
        rememberTrip: (request) =>
          update(() => ({
            routeChoice: "screened",
            request,
            screenedTrip: request,
          })),
        reset: (request) => update(() => ({ ...empty, request })),
      }}
    >
      {children}
    </DemoSession.Provider>
  );
}
export function useDemoSession() {
  const session = useContext(DemoSession);
  if (!session) throw new Error("Demo session provider is required");
  return session;
}
