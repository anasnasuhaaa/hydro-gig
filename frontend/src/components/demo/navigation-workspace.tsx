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
        title="A clearer view of the road ahead."
        description="Advance through fixed synthetic snapshots and inspect how authored costs change route selection."
      />
      <SimulationNotice />
      {request && scenario && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Simulation controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DemoSelect
                id="demo-route"
                label="Demonstration route"
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
                Advance simulation
                <SkipForward />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Selected frame: <strong>{request.step}</strong>. Fixed snapshots
              only; controls do not move a vehicle or start live monitoring.
            </p>
          </CardContent>
        </Card>
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
          <Alert
            className="border-risk-moderate/50 bg-risk-moderate/5"
            role="status"
          >
            <AlertTriangle className="text-risk-moderate" />
            <AlertTitle>
              Simulated experimental warning · {result.request.step}
            </AlertTitle>
            <AlertDescription>
              <p>{result.frame.warning}</p>
              <p>
                Affected segments:{" "}
                {result.frame.affected_edge_ids.join(", ") || "none authored"}.
              </p>
              <p>
                Selected weighted route:{" "}
                {result.origin_to_pickup.demonstration_weighted.status ===
                  "unreachable" ||
                result.pickup_to_destination.demonstration_weighted.status ===
                  "unreachable"
                  ? "incomplete — at least one leg is unavailable"
                  : affectedSelected.length
                    ? `includes authored cost changes on ${affectedSelected.join(", ")}`
                    : "no authored cost changes on selected segments; flood conditions remain unknown"}
                .
              </p>
            </AlertDescription>
          </Alert>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Synthetic road-network schematic</CardTitle>
            </CardHeader>
            <CardContent>
              <SchematicNetwork
                network={data.network.data.network}
                result={result}
                frame={result.frame}
              />
            </CardContent>
          </Card>
          <RouteResults result={result} network={data.network.data.network} />
        </>
      )}
    </>
  );
}
