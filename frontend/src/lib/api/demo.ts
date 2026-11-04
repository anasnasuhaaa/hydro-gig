import { apiRequest } from "@/lib/api/client";
import {
  demoNetworkSchema,
  frameSchema,
  manifestSchema,
  scenariosSchema,
  screenRequestSchema,
  screenResponseSchema,
  type ScreenRequest,
} from "@/lib/contracts/data";

export const demoApi = {
  manifest: (signal?: AbortSignal) =>
    apiRequest("/manifest", manifestSchema, { signal }),
  network: (signal?: AbortSignal) =>
    apiRequest("/network", demoNetworkSchema, { signal }),
  scenarios: (signal?: AbortSignal) =>
    apiRequest("/scenarios", scenariosSchema, { signal }),
  frame: (scenario: string, step: string, signal?: AbortSignal) =>
    apiRequest(
      `/scenarios/${encodeURIComponent(scenario)}/frames/${encodeURIComponent(step)}`,
      frameSchema,
      { signal },
    ),
  screen: (request: ScreenRequest, signal?: AbortSignal) =>
    apiRequest("/screen", screenResponseSchema, {
      signal,
      body: screenRequestSchema.parse(request),
    }).then((result) => {
      if (JSON.stringify(result.request) !== JSON.stringify(request)) {
        // Compare fields independently of JSON key order.
        if (
          Object.keys(request).some(
            (key) =>
              result.request[key as keyof ScreenRequest] !==
              request[key as keyof ScreenRequest],
          )
        )
          throw new Error(
            "The API returned a different demo trip. Results are unavailable.",
          );
      }
      return result;
    }),
};
