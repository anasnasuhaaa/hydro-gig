"use client";
import { useTranslations } from "next-intl";

import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { useDemoData } from "@/hooks/use-demo";
import { demoApi } from "@/lib/api/demo";
import {
  screenRequestSchema,
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
}: {
  network: RoadNetwork;
  scenarios: z.infer<typeof scenariosSchema>["scenarios"];
}) {
  const t = useTranslations("Screen");

  const session = useDemoSession();
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
      <Card className="shadow-none [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="size-5 text-primary" />
            {t("trip")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((request) => mutation.mutate(request))}
          >
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
                      onChange={field.onChange}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="scenario_id"
                render={({ field }) => (
                  <DemoSelect
                    id="scenario"
                    label={t("scenario")}
                    value={field.value}
                    onChange={field.onChange}
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
                    onChange={field.onChange}
                    options={scenario.time_steps.map((frame) => ({
                      value: frame.step,
                      label: frame.step,
                    }))}
                  />
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground">{t("direction")}</p>
            <Button
              type="submit"
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
          <Button asChild variant="outline" className="min-h-11">
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
      <PageHeading title={t("title")} description={t("subtitle")} />
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
        />
      ) : (
        <DemoLoading />
      )}
    </>
  );
}
