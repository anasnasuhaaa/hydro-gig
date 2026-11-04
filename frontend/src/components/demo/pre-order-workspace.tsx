"use client";
import { useTranslations } from "next-intl";

import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, ChevronDown, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { GuideLink } from "@/components/shared/guide-link";
import { PageHeading } from "@/components/shared/page-heading";
import { useDemoData } from "@/hooks/use-demo";
import { demoApi } from "@/lib/api/demo";
import {
  screenRequestSchema,
  stepSchema,
  type RoadNetwork,
  type ScreenRequest,
} from "@/lib/contracts/data";
import type { z } from "zod";
import { scenariosSchema } from "@/lib/contracts/data";
import { DemoError, DemoLoading, DemoSelect, SimulationNotice } from "./shared";
import { useDemoSession } from "./demo-session";
import { RouteResults } from "./route-results";

function ScreeningForm({
  network,
  scenarios,
  exampleTrip,
}: {
  network: RoadNetwork;
  exampleTrip: { origin: string; pickup: string; destination: string };
  scenarios: z.infer<typeof scenariosSchema>["scenarios"];
}) {
  const t = useTranslations("Screen");
  const timeline = useTranslations("Timeline");

  const session = useDemoSession();
  const [locationsOpen, setLocationsOpen] = useState(false);
  const form = useForm<ScreenRequest>({
    resolver: zodResolver(screenRequestSchema),
    defaultValues: session.request ?? {
      origin: "",
      pickup: "",
      destination: "",
      scenario_id: scenarios[0].scenario_id,
      step: "t0",
    },
  });
  const values = useWatch({ control: form.control });
  const mutation = useMutation({
    mutationFn: (request: ScreenRequest) => demoApi.screen(request),
    onSuccess: (result) => {
      if (
        Object.keys(result.request).some(
          (key) =>
            result.request[key as keyof ScreenRequest] !==
            form.getValues()[key as keyof ScreenRequest],
        )
      )
        return;
      session.rememberTrip(result.request);
      toast.success(t("success"));
    },
    onError: () => toast.error(t("error")),
  });
  const currentResult =
    mutation.data &&
    Object.keys(mutation.data.request).every(
      (key) =>
        mutation.data!.request[key as keyof ScreenRequest] ===
        values[key as keyof ScreenRequest],
    )
      ? mutation.data
      : undefined;
  const scenario =
    scenarios.find((scenario) => scenario.scenario_id === values.scenario_id) ??
    scenarios[0];
  const nodeOptions = network.nodes.map((node) => ({
    value: node.node_id,
    label: `${node.node_id} · ${t(`nodes.${node.node_id}`)}`,
  }));
  return (
    <>
      <Card className="border-primary/15 shadow-sm [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="size-5 text-primary" />
            {t("trip")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(
              (request) => mutation.mutate(request),
              () => setLocationsOpen(true),
            )}
          >
            <p className="text-sm text-muted-foreground">{t("startHint")}</p>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => {
                mutation.reset();
                form.reset({
                  ...exampleTrip,
                  scenario_id: scenarios[0].scenario_id,
                  step: stepSchema.parse(scenarios[0].time_steps[0].step),
                });
                setLocationsOpen(false);
              }}
            >
              {t("example")}
            </Button>
            <ol
              className="grid gap-3 rounded-xl bg-accent/40 p-4 sm:grid-cols-3"
              aria-label={t("trip")}
            >
              {(["origin", "pickup", "destination"] as const).map(
                (name, index) => (
                  <li key={name} className="flex min-w-0 items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/30 text-sm text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">{t(name)}</p>
                      <p className="break-words text-muted-foreground">
                        {values[name]
                          ? t(`nodes.${values[name]}`)
                          : t("notSelected")}
                      </p>
                    </div>
                    {index < 2 && (
                      <ArrowRight
                        className="mt-1 hidden size-4 shrink-0 text-muted-foreground sm:block"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                ),
              )}
            </ol>
            <Collapsible open={locationsOpen} onOpenChange={setLocationsOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="min-h-11">
                  {t("changeLocations")}
                  <ChevronDown />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                <div className="grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      ["origin", t("origin")],
                      ["pickup", t("pickup")],
                      ["destination", t("destination")],
                    ] as const
                  ).map(([name, label]) => (
                    <Controller
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field, fieldState }) => (
                        <DemoSelect
                          id={name}
                          label={label}
                          value={field.value}
                          onChange={(value) => {
                            mutation.reset();
                            field.onChange(value);
                          }}
                          onBlur={field.onBlur}
                          inputRef={field.ref}
                          options={nodeOptions}
                          error={
                            fieldState.error
                              ? t(
                                  fieldState.error.type === "custom"
                                    ? "distinct"
                                    : "required",
                                )
                              : undefined
                          }
                        />
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("direction")}
                </p>
              </CollapsibleContent>
            </Collapsible>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="min-h-11">
                  {t("settings")}
                  <ChevronDown />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="scenario_id"
                    render={({ field }) => (
                      <DemoSelect
                        id="scenario"
                        label={t("scenario")}
                        value={field.value}
                        onChange={(value) => {
                          mutation.reset();
                          field.onChange(value);
                        }}
                        options={scenarios.map((scenario) => ({
                          value: scenario.scenario_id,
                          label: t("scenarioName"),
                        }))}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="step"
                    render={({ field }) => (
                      <DemoSelect
                        id="frame"
                        label={t("frame")}
                        value={field.value}
                        onChange={(value) => {
                          mutation.reset();
                          field.onChange(value);
                        }}
                        options={scenario.time_steps.map((frame) => ({
                          value: frame.step,
                          label: timeline(frame.step),
                        }))}
                      />
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Button
              type="submit"
              variant={currentResult ? "outline" : "default"}
              className="min-h-11 w-full sm:w-auto"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t("screening") : t("screen")}
              <ArrowRight />
            </Button>
          </form>
        </CardContent>
      </Card>
      {mutation.isPending && <DemoLoading />}
      {mutation.isError && (
        <DemoError
          error={mutation.error}
          retry={() => {
            void form.handleSubmit((request) => mutation.mutate(request))();
          }}
        />
      )}
      {currentResult && !mutation.isPending && !mutation.isError && (
        <>
          <RouteResults result={currentResult} network={network} />
          <Button asChild className="min-h-11 w-full sm:w-auto">
            <Link href="/navigation">
              {t("open")}
              <ArrowRight />
            </Link>
          </Button>
        </>
      )}
    </>
  );
}
export function PreOrderWorkspace() {
  const t = useTranslations("Screen");

  const data = useDemoData();
  const error =
    data.network.error ?? data.scenarios.error ?? data.manifest.error;
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PageHeading title={t("title")} description={t("subtitle")} />
        <GuideLink />
      </div>
      <SimulationNotice />
      {error ? (
        <DemoError
          error={error}
          retry={() => {
            void data.network.refetch();
            void data.scenarios.refetch();
            void data.manifest.refetch();
          }}
        />
      ) : data.network.data && data.scenarios.data && data.manifest.data ? (
        <ScreeningForm
          network={data.network.data.network}
          scenarios={data.scenarios.data.scenarios}
          exampleTrip={data.manifest.data.default_trip}
        />
      ) : (
        <DemoLoading />
      )}
    </>
  );
}
