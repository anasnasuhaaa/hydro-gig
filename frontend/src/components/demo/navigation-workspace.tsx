"use client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, SkipForward } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeading } from "@/components/shared/page-heading";
import { useDemoData } from "@/hooks/use-demo";
import { demoApi } from "@/lib/api/demo";
import { stepSchema, type ScreenRequest } from "@/lib/contracts/data";
import { useDemoSession } from "./demo-session";
import { DemoError, DemoLoading, DemoSelect, SimulationNotice } from "./shared";
import { RouteResults } from "./route-results";
import { SchematicNetwork } from "./schematic-network";

export function NavigationWorkspace() {
  const data = useDemoData();
  const session = useDemoSession();
  const fallback: ScreenRequest | null =
    data.manifest.data && data.scenarios.data
      ? {
          ...data.manifest.data.default_trip,
          scenario_id: data.scenarios.data.scenarios[0].scenario_id,
          step: "t0",
        }
      : null;
  const request = session.request ?? fallback;
  const query = useQuery({
    queryKey: ["demo-screen", request],
    queryFn: ({ signal }) => demoApi.screen(request!, signal),
    enabled: !!request,
    retry: false,
  });
  useEffect(() => {
    if (query.error) toast.error(query.error.message);
  }, [query.error]);
  const error =
    data.network.error ??
    data.scenarios.error ??
    data.manifest.error ??
    query.error;
  const scenario = data.scenarios.data?.scenarios.find(
    (scenario) => scenario.scenario_id === request?.scenario_id,
  );
  const result = !query.isFetching && !error ? query.data : undefined;
  const screened = session.screenedTrip;
  const selectedScreened = session.routeChoice === "screened" && !!screened;
  const selectedEdges = result
    ? [
        ...result.origin_to_pickup.demonstration_weighted.edge_ids,
        ...result.pickup_to_destination.demonstration_weighted.edge_ids,
      ]
    : [];
  const affectedSelected =
    result?.frame.affected_edge_ids.filter((id) =>
      selectedEdges.includes(id),
    ) ?? [];
  const advance = () => {
    if (!request || !scenario) return;
    const index = scenario.time_steps.findIndex(
      (frame) => frame.step === request.step,
    );
    const next = scenario.time_steps[index + 1];
    if (next)
      session.setRequest({ ...request, step: stepSchema.parse(next.step) });
  };
  return (
    <>
      <PageHeading
        title="Explore your route."
        description="Compare fixed scenario frames on a schematic network."
      />
      <SimulationNotice />
      {request && scenario && (
        <section
          aria-label="Simulation controls"
          className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DemoSelect
              id="demo-route"
              label="Trip"
              value={selectedScreened ? "screened" : "default"}
              onChange={(value) => {
                const trip = value === "screened" ? screened : fallback;
                if (trip) {
                  session.setRouteChoice(
                    value === "screened" ? "screened" : "default",
                  );
                  session.setRequest({ ...trip, step: request.step });
                }
              }}
              options={[
                {
                  value: "default",
                  label: `Fixture trip · ${fallback?.origin} → ${fallback?.pickup} → ${fallback?.destination}`,
                },
                ...(screened
                  ? [
                      {
                        value: "screened",
                        label: `Last screened trip · ${screened.origin} → ${screened.pickup} → ${screened.destination}`,
                      },
                    ]
                  : []),
              ]}
            />
            <DemoSelect
              id="navigation-scenario"
              label="Scenario"
              value={request.scenario_id}
              onChange={(scenario_id) =>
                session.setRequest({ ...request, scenario_id, step: "t0" })
              }
              options={data.scenarios.data!.scenarios.map((scenario) => ({
                value: scenario.scenario_id,
                label: scenario.name,
              }))}
            />
          </div>
          <div
            className="flex flex-wrap items-center gap-3"
            role="group"
            aria-label="Simulation frames"
          >
            {scenario.time_steps.map((frame) => (
              <Button
                key={frame.step}
                variant={frame.step === request.step ? "default" : "outline"}
                className="min-h-11 min-w-11"
                aria-pressed={frame.step === request.step}
                onClick={() =>
                  session.setRequest({
                    ...request,
                    step: stepSchema.parse(frame.step),
                  })
                }
              >
                {frame.step}
              </Button>
            ))}
            <Button
              variant="outline"
              className="min-h-11"
              disabled={request.step === scenario.time_steps.at(-1)?.step}
              onClick={advance}
            >
              Next frame
              <SkipForward />
            </Button>
          </div>
        </section>
      )}
      {error ? (
        <DemoError
          error={error}
          retry={() => {
            void data.network.refetch();
            void data.scenarios.refetch();
            void data.manifest.refetch();
            void query.refetch();
          }}
        />
      ) : !result || !data.network.data ? (
        <DemoLoading />
      ) : (
        <>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
            <Card className="min-w-0 shadow-none">
              <CardHeader>
                <CardTitle>
                  <h2>Synthetic road-network schematic</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SchematicNetwork
                  network={data.network.data.network}
                  result={result}
                  frame={result.frame}
                />
              </CardContent>
            </Card>
            <Alert
              className="min-w-0 border-risk-moderate/30 bg-risk-moderate/5 p-4"
              role="status"
            >
              <AlertTriangle className="text-risk-moderate" />
              <AlertTitle>Simulated warning · {result.request.step}</AlertTitle>
              <AlertDescription className="space-y-3 [&_p:not(:last-child)]:mb-0">
                <p>{result.frame.warning}</p>
                <p>
                  Affected segments:{" "}
                  {result.frame.affected_edge_ids.join(", ") || "none authored"}
                  .
                </p>
                <p>
                  {result.origin_to_pickup.demonstration_weighted.status ===
                    "unreachable" ||
                  result.pickup_to_destination.demonstration_weighted.status ===
                    "unreachable"
                    ? "Selected route incomplete: at least one leg is unavailable."
                    : affectedSelected.length
                      ? `Selected route includes cost changes on ${affectedSelected.join(", ")}.`
                      : "No authored cost changes on the selected route. Flood conditions remain unknown."}
                </p>
              </AlertDescription>
            </Alert>
          </div>
          <RouteResults result={result} network={data.network.data.network} />
        </>
      )}
    </>
  );
}
