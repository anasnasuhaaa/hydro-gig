"use client";
import { Disclosure } from "@/components/ui/disclosure";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { initial, useExperimentalSession } from "./session";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoSelect } from "@/components/demo/shared";
import { ExperimentalNetwork } from "./network";
import { ScenarioTimeline, FrameSummary } from "./timeline";
import { RouteComparison, type RouteMode } from "./route-comparison";
import {
  experimentalApi,
  requestSchema,
  type FixtureRequest,
} from "@/lib/api/experimental";

export function DatasetMode() {
  const t = useTranslations("Experimental");
  const { ready, invalid } = useExperimentalSession();
  return (
    <div className="space-y-4">
      {invalid && (
        <p role="status" className="text-sm">
          {t("sessionInvalid")}
        </p>
      )}
      {ready ? <Workspace /> : <Skeleton className="h-80 rounded-2xl" />}
    </div>
  );
}
function Workspace() {
  const t = useTranslations("Experimental");
  const locale = useLocale();
  const guide = useTranslations("Guide");
  const session = useExperimentalSession();
  const { request, setRequest } = session;
  const navigation = usePathname() === "/navigation";
  const [replayVersion, setReplayVersion] = useState(0);
  const [selected, setSelected] = useState<RouteMode>("weighted");
  const form = useForm<FixtureRequest>({
    resolver: zodResolver(requestSchema),
    values: request,
  });
  const pendingEdits = form.formState.isDirty;
  const network = useQuery({
    queryKey: ["experimental", "network"],
    queryFn: ({ signal }) => experimentalApi.network(signal),
  });
  const query = useQuery({
    queryKey: ["experimental", "routes", request],
    queryFn: ({ signal }) => experimentalApi.screen(request, signal),
  });
  const index = Number(request.step.slice(1));
  const previous = useQuery({
    queryKey: ["experimental", "routes", { ...request, step: `t${index - 1}` }],
    queryFn: ({ signal }) =>
      experimentalApi.screen(
        { ...request, step: requestSchema.shape.step.parse(`t${index - 1}`) },
        signal,
      ),
    enabled: index > 0,
  });
  const result = query.data,
    graph = network.data;
  const weighted = new Set(
    result
      ? [
          ...result.origin_to_pickup.weighted.edge_ids,
          ...result.pickup_to_destination.weighted.edge_ids,
        ]
      : [],
  );
  const baseline = new Set(
    result
      ? [
          ...result.origin_to_pickup.baseline.edge_ids,
          ...result.pickup_to_destination.baseline.edge_ids,
        ]
      : [],
  );
  return (
    <section className="space-y-5" aria-label={t("title")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold tracking-wide text-primary">
            {t("label")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t(navigation ? "navigationTitle" : "screenTitle")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(navigation ? "navigationHelp" : "screenHelp")}{" "}
            <Link className="underline" href="/guide">
              {guide("help")}
            </Link>
          </p>
        </div>
        <Button
          variant="ghost"
          aria-label={t("resetTrip")}
          className="min-h-11"
          onClick={() => {
            session.reset();
            form.reset(initial);
            setSelected("weighted");
            setReplayVersion((v) => v + 1);
          }}
        >
          <RotateCcw className="size-4" />
          <span className="sr-only sm:not-sr-only">{t("resetTrip")}</span>
        </Button>
      </div>
      {navigation && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-2 text-sm">
          <span>
            {request.origin} → {request.pickup} → {request.destination}
          </span>
          <Button asChild variant="ghost">
            <Link href="/pre-order">{t("backScreen")}</Link>
          </Button>
        </div>
      )}
      {graph && !navigation && (
        <form
          className="grid grid-cols-3 items-end gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto] sm:p-5"
          onSubmit={form.handleSubmit((values) =>
            setRequest({ ...values, step: request.step }),
          )}
        >
          {(["origin", "pickup", "destination"] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field }) => (
                <DemoSelect
                  id={`experimental-${name}`}
                  label={t(name)}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    setReplayVersion((v) => v + 1);
                  }}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  options={graph.nodes.map((n) => ({
                    value: n.node_id,
                    label: n.node_id,
                  }))}
                />
              )}
            />
          ))}
          <Button type="submit" className="min-h-11 col-span-3 lg:col-span-1">
            <ArrowRight className="size-4" />
            {t("screen")}
          </Button>
        </form>
      )}
      <ScenarioTimeline
        key={replayVersion}
        compact={!navigation}
        locked={pendingEdits}
        request={request}
        onChange={(step) => setRequest({ ...request, step })}
        result={result}
        busy={query.isFetching}
        error={query.isError}
      />
      {pendingEdits ? (
        <p
          role="status"
          className="border-l-2 border-primary px-3 py-2 text-sm"
        >
          {t("pendingEdits")}
        </p>
      ) : network.isError || query.isError ? (
        <div role="alert" className="rounded-2xl border p-5">
          <p>{t("error")}</p>
          <Button
            className="mt-3 min-h-11"
            onClick={() => {
              void network.refetch();
              void query.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </div>
      ) : !result || !graph ? (
        <div role="status" className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,1fr)]">
            <div className="min-w-0 space-y-4">
              <section className="overflow-hidden rounded-2xl border bg-card">
                <div className="border-b p-4 sm:p-5">
                  <h2 className="text-lg font-semibold">{t("networkTitle")}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("schematic")}
                  </p>
                </div>
                <div className="p-3 sm:p-5">
                  <ExperimentalNetwork
                    key={replayVersion}
                    graph={graph}
                    weighted={weighted}
                    baseline={baseline}
                    result={result}
                    selected={selected}
                  />
                </div>
              </section>
            </div>
            <div className="min-w-0 space-y-4">
              <FrameSummary
                result={result}
                previous={previous.data}
                failed={previous.isError}
                onRetry={() => {
                  void previous.refetch();
                }}
              />
              <RouteComparison
                result={result}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          </div>
          <Disclosure
            className="rounded-2xl border bg-card p-4"
            title={<>{t("values")}</>}
          >
            <p className="my-3 text-sm text-muted-foreground">
              {t("unitsCaveat")}
            </p>
            <p className="my-3 text-sm">
              {t("time")}:{" "}
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Jakarta",
              }).format(new Date(result.frame.timestamp))}{" "}
              {t("timezone")}
            </p>
            <p className="my-3 break-words text-xs text-muted-foreground">
              {t("source")}: {result.dataset_id} / {result.dataset_version} ·{" "}
              {result.network_id} · {result.weighting_version}
            </p>
            <p className="my-3 text-sm text-muted-foreground">
              {t("limitations")}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {["edge", "h_m", "u_ms", "v_ms", "weight", "delta"].map(
                      (k) => (
                        <th className="p-2" key={k}>
                          {t(k)}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.frame.samples).map(([edge, s]) => (
                    <tr key={edge} className="border-t">
                      <td className="p-2 font-mono">{edge}</td>
                      {[
                        s.h_m,
                        s.u_ms,
                        s.v_ms,
                        s.weight,
                        result.frame.weight_deltas[edge] ?? null,
                      ].map((v, i) => (
                        <td className="p-2 tabular-nums" key={i}>
                          {v ?? t("unknown")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Disclosure>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
            <Button asChild variant="ghost" className="min-h-11">
              <Link href={navigation ? "/pre-order" : "/dashboard"}>
                <ArrowLeft className="size-4" />
                {t(navigation ? "backScreen" : "backDashboard")}
              </Link>
            </Button>
            <Button
              asChild
              className="h-auto min-h-11 whitespace-normal"
              onClick={() => session.remember([...weighted])}
            >
              <Link href={navigation ? "/claims" : "/navigation"}>
                {t(navigation ? "continueClaims" : "continueNavigation")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
