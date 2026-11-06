"use client";
import { Disclosure } from "@/components/ui/disclosure";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Pause, Play, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  experimentalApi,
  requestSchema,
  type FixtureRequest,
  type FixtureResult,
} from "@/lib/api/experimental";
import { routeTotal } from "./route-comparison";

export function ScenarioTimeline({
  request,
  onChange,
  result,
  busy,
  error,
  compact = false,
  locked = false,
}: {
  request: FixtureRequest;
  onChange: (step: FixtureRequest["step"]) => void;
  result: FixtureResult | undefined;
  busy: boolean;
  error: boolean;
  compact?: boolean;
  locked?: boolean;
}) {
  const t = useTranslations("Experimental");
  const locale = useLocale();
  const [playing, setPlaying] = useState(false);
  const frames = useQuery({
    queryKey: ["experimental", "scenarios"],
    queryFn: ({ signal }) => experimentalApi.scenarios(signal),
  });
  const steps = requestSchema.shape.step.options;
  const index = steps.indexOf(request.step);
  const active = playing && index < steps.length - 1 && !error && !locked;
  useEffect(() => {
    if (!active || busy || result?.frame.step !== request.step) return;
    const timer = setTimeout(() => {
      onChange(steps[index + 1]);
      if (index + 1 === steps.length - 1) setPlaying(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [active, busy, result, request.step, index, onChange, steps]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  const choose = (step: FixtureRequest["step"]) => {
    setPlaying(false);
    onChange(step);
  };
  return (
    <section
      aria-label={t("frames")}
      className="rounded-2xl border border-primary/25 bg-card p-4 sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <History className="size-4 text-primary" />
            {t(compact ? "frames" : "timelineTitle")}
          </h2>
          {!compact && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("historical")}
            </p>
          )}
        </div>
      </div>
      <div
        className="relative grid grid-cols-5 gap-1 sm:gap-3"
        role="group"
        aria-label={t("frames")}
      >
        {steps.map((step) => {
          const frame = frames.data?.frames.find((f) => f.step === step);
          return (
            <Button
              key={step}
              aria-label={step}
              disabled={locked}
              aria-pressed={step === request.step}
              variant={step === request.step ? "default" : "outline"}
              onClick={() => choose(step)}
              className={`h-auto ${compact ? "min-h-11" : "min-h-16"} min-w-0 flex-col gap-1 rounded-xl px-1 py-2 text-base font-semibold`}
            >
              <span>{step}</span>
              <span className="text-[10px] font-normal tabular-nums sm:text-xs">
                {frame
                  ? new Intl.DateTimeFormat(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hourCycle: "h23",
                      timeZone: "Asia/Jakarta",
                    }).format(new Date(frame.timestamp))
                  : t("timePending")}
              </span>
            </Button>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              aria-label={t("previousFrame")}
              className="min-h-11 min-w-11 px-3"
              disabled={locked || index === 0}
              onClick={() => choose(steps[index - 1])}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              aria-label={t("nextFrame")}
              className="min-h-11 min-w-11 px-3"
              disabled={locked || index === steps.length - 1}
              onClick={() => choose(steps[index + 1])}
            >
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="secondary"
              className="min-h-11"
              disabled={
                locked ||
                (busy && !active) ||
                error ||
                index === steps.length - 1
              }
              aria-pressed={active}
              onClick={() => setPlaying(!active)}
            >
              {active ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              {t(active ? "pause" : "play")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("playSpeed")}</p>
        </div>
      )}
      {result && result.frame.step === request.step && !error && !locked && (
        <p
          data-testid="scenario-time"
          className="mt-3 border-t pt-2 text-xs sm:text-sm"
        >
          <span className="text-muted-foreground">{t("time")}: </span>
          {new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Jakarta",
          }).format(new Date(result.frame.timestamp))}{" "}
          {t("timezone")}
        </p>
      )}
    </section>
  );
}
export function FrameSummary({
  result,
  previous,
  failed,
  onRetry,
}: {
  result: FixtureResult;
  previous: FixtureResult | undefined;
  failed: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations("Experimental");
  const locale = useLocale();
  const initial = result.frame.previous_step === null;
  const paths = (r: FixtureResult) =>
    JSON.stringify(
      [r.origin_to_pickup.weighted, r.pickup_to_destination.weighted].map(
        (p) => [p.status, p.edge_ids],
      ),
    );
  const currentCost = routeTotal(result, "weighted", "objective_cost"),
    previousCost = previous
      ? routeTotal(previous, "weighted", "objective_cost")
      : null;
  const delta =
    currentCost !== null && previousCost !== null
      ? currentCost - previousCost
      : null;
  const number = (v: number | null | undefined) =>
    v == null
      ? t("unknown")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(v);
  return (
    <section
      className="rounded-2xl border bg-card p-4"
      aria-label={t("changeSummary")}
    >
      <div aria-live="polite">
        <h2 className="font-semibold">
          {initial
            ? t("initial")
            : failed
              ? t("comparisonUnavailable")
              : previous
                ? t(
                    paths(result) !== paths(previous)
                      ? "changed"
                      : delta !== 0 ||
                          result.frame.changed_edge_ids.some((id) =>
                            [
                              ...result.origin_to_pickup.weighted.edge_ids,
                              ...result.pickup_to_destination.weighted.edge_ids,
                            ].includes(id),
                          )
                        ? "unchanged"
                        : "noRelevantChange",
                  )
                : t("loading")}
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("changedCount")}
            </dt>
            <dd
              data-testid="changed-count"
              className="mt-1 text-2xl font-semibold tabular-nums"
            >
              {result.frame.changed_edge_ids.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("costDelta")}</dt>
            <dd
              data-testid="cost-delta"
              className="mt-1 text-2xl font-semibold tabular-nums"
            >
              {initial || failed ? t("unknown") : number(delta)}
            </dd>
            <p className="text-xs text-muted-foreground">{t("units")}</p>
          </div>
        </dl>
      </div>
      {failed && (
        <Button className="mt-3 min-h-11" variant="outline" onClick={onRetry}>
          {t("retryComparison")}
        </Button>
      )}
      {!initial && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("deltaHelp", { step: result.frame.previous_step! })}
        </p>
      )}
      {result.frame.changed_edge_ids.length > 0 && (
        <Disclosure className="mt-4 border-t pt-2" title={<>{t("affected")}</>}>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("unitsCaveat")}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  {["edge", "h_m", "u_ms", "v_ms", "delta"].map((k) => (
                    <th key={k} className="p-2">
                      {t(k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.frame.changed_edge_ids.map((edge) => (
                  <tr key={edge} className="border-t">
                    <th className="p-2 font-mono font-normal">{edge}</th>
                    {(["h_m", "u_ms", "v_ms"] as const).map((key) => (
                      <td key={key} className="p-2 tabular-nums">
                        {number(previous?.frame.samples[edge]?.[key])} →{" "}
                        {number(result.frame.samples[edge]?.[key])}
                      </td>
                    ))}
                    <td className="p-2 tabular-nums">
                      {number(result.frame.weight_deltas[edge])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Disclosure>
      )}
    </section>
  );
}
