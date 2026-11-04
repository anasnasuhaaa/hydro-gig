"use client";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { GuideLink } from "@/components/shared/guide-link";
import { PageHeading } from "@/components/shared/page-heading";
import { useDemoData } from "@/hooks/use-demo";
import { demoApi } from "@/lib/api/demo";
import { stepSchema, type ScreenRequest } from "@/lib/contracts/data";
import { isAvailableDemoTrip, useDemoSession } from "./demo-session";
import { DemoError, DemoLoading, DemoSelect, SimulationNotice } from "./shared";
import { RouteResults } from "./route-results";
import { SchematicNetwork } from "./schematic-network";
import { FrameChanges } from "./frame-changes";

export function NavigationWorkspace() {
  const t = useTranslations("Navigation");
  const timeline = useTranslations("Timeline");
  const stops = useTranslations("Screen");
  const data = useDemoData();
  const session = useDemoSession();
  const scenarios = data.scenarios.data?.scenarios;
  const network = data.network.data?.network;
  const fallback: ScreenRequest | null =
    data.manifest.data && scenarios
      ? {
          ...data.manifest.data.default_trip,
          scenario_id: scenarios[0].scenario_id,
          step: stepSchema.parse(scenarios[0].time_steps[0].step),
        }
      : null;
  const request =
    session.ready && network && scenarios
      ? isAvailableDemoTrip(session.request, network, scenarios)
        ? session.request
        : fallback
      : null;
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
  const scenario = scenarios?.find(
    (scenario) => scenario.scenario_id === request?.scenario_id,
  );
  const result = !query.isFetching && !error ? query.data : undefined;
  const screened =
    network &&
    scenarios &&
    isAvailableDemoTrip(session.screenedTrip, network, scenarios)
      ? session.screenedTrip
      : null;
  const selectedScreened = session.routeChoice === "screened" && !!screened;
  const index =
    scenario?.time_steps.findIndex((frame) => frame.step === request?.step) ??
    0;
  const previousStep = scenario?.time_steps[index - 1];
  const previousRequest =
    request && previousStep
      ? { ...request, step: stepSchema.parse(previousStep.step) }
      : null;
  const move = (offset: number) => {
    const frame = scenario?.time_steps[index + offset];
    if (request && frame)
      session.setRequest({ ...request, step: stepSchema.parse(frame.step) });
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
          <p className="break-words text-sm font-medium">
            {[request.origin, request.pickup, request.destination]
              .map((id) => stops(`nodes.${id}`))
              .join(" → ")}
          </p>
          <p className="text-sm text-muted-foreground">{t("timelineHint")}</p>
          <div
            className="grid gap-2 sm:grid-cols-3"
            role="group"
            aria-label={t("frames")}
          >
            {scenario.time_steps.map((frame) => (
              <Button
                key={frame.step}
                variant={frame.step === request.step ? "default" : "outline"}
                className="min-h-11 min-w-0 whitespace-normal px-2 py-2"
                aria-pressed={frame.step === request.step}
                onClick={() =>
                  session.setRequest({
                    ...request,
                    step: stepSchema.parse(frame.step),
                  })
                }
              >
                {timeline(frame.step)}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              disabled={index <= 0}
              onClick={() => move(-1)}
            >
              <SkipBack />
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={index >= scenario.time_steps.length - 1}
              onClick={() => move(1)}
            >
              {t("next")}
              <SkipForward />
            </Button>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => {
                if (fallback) session.reset(fallback);
              }}
            >
              <RotateCcw />
              {t("reset")}
            </Button>
          </div>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="min-h-11">
                {t("settings")}
                <ChevronDown />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="grid gap-4 pt-3 sm:grid-cols-2">
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
                options={scenarios!.map((scenario) => ({
                  value: scenario.scenario_id,
                  label: t("scenarioName"),
                }))}
              />
            </CollapsibleContent>
          </Collapsible>
        </section>
      )}
      {error ? (
        <DemoError
          error={error}
          retry={() => {
            void data.network.refetch();
            void data.scenarios.refetch();
            void data.manifest.refetch();
            if (request) void query.refetch();
          }}
        />
      ) : !result || !network ? (
        <DemoLoading />
      ) : (
        <>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
            <Card className="min-w-0 border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle>
                  <h2>{t("network")}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SchematicNetwork
                  network={network}
                  result={result}
                  frame={result.frame}
                />
              </CardContent>
            </Card>
            <FrameChanges result={result} previousRequest={previousRequest} />
          </div>
          <RouteResults result={result} network={network} />
        </>
      )}
    </>
  );
}
