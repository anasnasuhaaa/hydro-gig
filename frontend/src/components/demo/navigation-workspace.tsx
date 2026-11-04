"use client";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, SkipForward } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuideLink } from "@/components/shared/guide-link";
import { PageHeading } from "@/components/shared/page-heading";
import { useDemoData } from "@/hooks/use-demo";
import { demoApi } from "@/lib/api/demo";
import { stepSchema, type ScreenRequest } from "@/lib/contracts/data";
import { useDemoSession } from "./demo-session";
import { DemoError, DemoLoading, DemoSelect, SimulationNotice } from "./shared";
import { RouteResults } from "./route-results";
import { SchematicNetwork } from "./schematic-network";

export function NavigationWorkspace() {
  const t = useTranslations("Navigation");

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
    if (query.error) toast.error(t("error"));
  }, [query.error, t]);
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
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PageHeading title={t("title")} description={t("subtitle")} />
        <GuideLink />
      </div>
      <SimulationNotice />
      {request && scenario && (
        <section
          aria-label={t("controls")}
          className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DemoSelect
              id="demo-route"
              label={t("trip")}
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
                  label: t("fixture", {
                    trip: `${fallback?.origin} → ${fallback?.pickup} → ${fallback?.destination}`,
                  }),
                },
                ...(screened
                  ? [
                      {
                        value: "screened",
                        label: t("screened", {
                          trip: `${screened.origin} → ${screened.pickup} → ${screened.destination}`,
                        }),
                      },
                    ]
                  : []),
              ]}
            />
            <DemoSelect
              id="navigation-scenario"
              label={t("scenario")}
              value={request.scenario_id}
              onChange={(scenario_id) =>
                session.setRequest({ ...request, scenario_id, step: "t0" })
              }
              options={data.scenarios.data!.scenarios.map((scenario) => ({
                value: scenario.scenario_id,
                label: t("scenarioName"),
              }))}
            />
          </div>
          <div
            className="flex flex-wrap items-center gap-3"
            role="group"
            aria-label={t("frames")}
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
              {t("next")}
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
                  <h2>{t("network")}</h2>
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
              <AlertTitle>
                {t("warning", { step: result.request.step })}
              </AlertTitle>
              <AlertDescription className="space-y-3 [&_p:not(:last-child)]:mb-0">
                <p>{t(`warnings.${result.request.step}`)}</p>
                <p>
                  {t("affected")}{" "}
                  {result.frame.affected_edge_ids.join(", ") || t("none")}.
                </p>
                <p>
                  {result.origin_to_pickup.demonstration_weighted.status ===
                    "unreachable" ||
                  result.pickup_to_destination.demonstration_weighted.status ===
                    "unreachable"
                    ? t("incomplete")
                    : affectedSelected.length
                      ? t("changes", { edges: affectedSelected.join(", ") })
                      : t("unchanged")}
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
